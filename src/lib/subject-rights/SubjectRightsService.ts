import { db } from '@/lib/db';

export interface SubjectRightsRequest {
  id: string;
  requestType: 'ACCESS_REQUEST' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICT_PROCESSING' | 'DATA_PORTABILITY' | 'OBJECT_AUTOMATED' | 'CCPA_DELETE' | 'CCPA_OPT_OUT' | 'LGPD_ACCESS' | 'LGPD_DELETE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'ESCALATED' | 'EXPIRED';
  requestedBy: string;
  requestData: any;
  response?: any;
  legalBasis: string;
  jurisdiction?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  completedAt?: Date;
  metadata: any;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  consentObjects?: Array<{
    id: string;
    consentType: string;
    purpose: string;
    isRevoked: boolean;
  }>;
  dataErasureLogs?: Array<{
    id: string;
    resourceType: string;
    erasureMethod: string;
    erasedAt: Date;
  }>;
  dataRectificationLogs?: Array<{
    id: string;
    resourceType: string;
    changeReason: string;
    rectifiedAt: Date;
  }>;
}

export interface SubjectRightsStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byJurisdiction: Record<string, number>;
  avgProcessingTimeMs: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  autoCalculatedDueDate?: Date;
}

export class SubjectRightsService {
  /**
   * Create a new subject rights request
   */
  static async createRequest(data: {
    requestType: string;
    requestedBy: string;
    requestData: any;
    legalBasis: string;
    jurisdiction?: string;
    priority?: string;
    dueDate?: Date;
    metadata: any;
    tenantId: string;
  }): Promise<{ request: SubjectRightsRequest; validation: ValidationResult }> {
    // Validate the request
    const validation = this.validateRequest(data);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate auto due date if not provided
    const finalDueDate = data.dueDate || validation.autoCalculatedDueDate;

    // Create the request in the database
    const request = await db.subjectRightsRequest.create({
      data: {
        requestType: data.requestType,
        status: 'PENDING',
        requestedBy: data.requestedBy,
        requestData: data.requestData || {},
        legalBasis: data.legalBasis,
        jurisdiction: data.jurisdiction,
        priority: data.priority || 'MEDIUM',
        dueDate: finalDueDate,
        metadata: data.metadata || {},
        tenantId: data.tenantId,
      },
      include: {
        consentObjects: true,
        dataErasureLogs: true,
        dataRectificationLogs: true,
      },
    });

    return {
      request: this.mapDbToInterface(request),
      validation,
    };
  }

  /**
   * Get requests by tenant
   */
  static async getRequestsByTenant(
    tenantId: string,
    filters?: {
      status?: string;
      priority?: string;
      requestType?: string;
      jurisdiction?: string;
    }
  ): Promise<SubjectRightsRequest[]> {
    const where: any = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.requestType && { requestType: filters.requestType }),
      ...(filters?.jurisdiction && { jurisdiction: filters.jurisdiction }),
    };

    const requests = await db.subjectRightsRequest.findMany({
      where,
      include: {
        consentObjects: true,
        dataErasureLogs: true,
        dataRectificationLogs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests.map(this.mapDbToInterface);
  }

  /**
   * Get a specific request by ID
   */
  static async getRequestById(id: string): Promise<SubjectRightsRequest | null> {
    const request = await db.subjectRightsRequest.findUnique({
      where: { id },
      include: {
        consentObjects: true,
        dataErasureLogs: true,
        dataRectificationLogs: true,
      },
    });

    return request ? this.mapDbToInterface(request) : null;
  }

  /**
   * Update request status
   */
  static async updateRequestStatus(
    id: string,
    status: string,
    response?: any
  ): Promise<SubjectRightsRequest> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (response) {
      updateData.response = response;
    }

    const request = await db.subjectRightsRequest.update({
      where: { id },
      data: updateData,
      include: {
        consentObjects: true,
        dataErasureLogs: true,
        dataRectificationLogs: true,
      },
    });

    return this.mapDbToInterface(request);
  }

  /**
   * Process an access request
   */
  static async processAccessRequest(id: string): Promise<SubjectRightsRequest> {
    const request = await this.getRequestById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Request is not in pending status');
    }

    // Simulate gathering all personal data for the user
    const personalData = await this.gatherPersonalData(request.requestedBy, request.tenantId);

    // Update request status and include response
    const response = {
      personalData,
      generatedAt: new Date().toISOString(),
      dataSources: ['consent_objects', 'user_profiles', 'audit_logs'],
      recordCount: Object.keys(personalData).length,
    };

    return await this.updateRequestStatus(id, 'COMPLETED', response);
  }

  /**
   * Process an erasure request
   */
  static async processErasureRequest(id: string): Promise<SubjectRightsRequest> {
    const request = await this.getRequestById(id);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Request is not in pending status');
    }

    // Find and revoke related consent objects
    const revokedConsents = await this.revokeRelatedConsents(request.requestedBy, request.tenantId);

    // Log data erasure activities
    const erasureLogs = await this.logDataErasure(id, request.requestedBy);

    // Update request status and include response
    const response = {
      revokedConsents: revokedConsents.length,
      erasureLogs: erasureLogs.length,
      processedAt: new Date().toISOString(),
      affectedSystems: ['consent_management', 'user_profiles', 'audit_logs'],
    };

    return await this.updateRequestStatus(id, 'COMPLETED', response);
  }

  /**
   * Check for overdue requests and escalate them
   */
  static async checkOverdueRequests(tenantId?: string): Promise<SubjectRightsRequest[]> {
    const where: any = {
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
      dueDate: {
        lt: new Date(),
      },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const overdueRequests = await db.subjectRightsRequest.findMany({
      where,
      include: {
        consentObjects: true,
        dataErasureLogs: true,
        dataRectificationLogs: true,
      },
    });

    // Escalate all overdue requests
    const escalatedRequests: SubjectRightsRequest[] = [];
    for (const request of overdueRequests) {
      if (request.status !== 'ESCALATED') {
        const escalated = await this.updateRequestStatus(request.id, 'ESCALATED');
        escalatedRequests.push(escalated);
      }
    }

    return escalatedRequests;
  }

  /**
   * Get subject rights statistics
   */
  static async getSubjectRightsStats(tenantId: string): Promise<SubjectRightsStats> {
    const requests = await db.subjectRightsRequest.findMany({
      where: { tenantId },
    });

    const now = new Date();
    const overdueRequests = requests.filter(req => 
      req.dueDate && req.dueDate < now && req.status !== 'COMPLETED'
    );

    const byType = requests.reduce((acc, req) => {
      acc[req.requestType] = (acc[req.requestType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = requests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byJurisdiction = requests.reduce((acc, req) => {
      const jurisdiction = req.jurisdiction || 'Unknown';
      acc[jurisdiction] = (acc[jurisdiction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average processing time for completed requests
    const completedRequests = requests.filter(req => req.status === 'COMPLETED' && req.completedAt);
    const avgProcessingTimeMs = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => {
          const processingTime = req.completedAt!.getTime() - req.createdAt.getTime();
          return sum + processingTime;
        }, 0) / completedRequests.length
      : 0;

    return {
      total: requests.length,
      pending: byStatus['PENDING'] || 0,
      inProgress: byStatus['IN_PROGRESS'] || 0,
      completed: byStatus['COMPLETED'] || 0,
      overdue: overdueRequests.length,
      byType,
      byStatus,
      byJurisdiction,
      avgProcessingTimeMs,
    };
  }

  /**
   * Validate a subject rights request
   */
  private static validateRequest(data: {
    requestType: string;
    requestedBy: string;
    legalBasis: string;
    jurisdiction?: string;
    dueDate?: Date;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let autoCalculatedDueDate: Date | undefined;

    // Required fields
    if (!data.requestType) {
      errors.push('Request type is required');
    }

    if (!data.requestedBy) {
      errors.push('Requested by is required');
    }

    if (!data.legalBasis) {
      errors.push('Legal basis is required');
    }

    // Validate request type
    const validRequestTypes = [
      'ACCESS_REQUEST', 'RECTIFICATION', 'ERASURE', 'RESTRICT_PROCESSING',
      'DATA_PORTABILITY', 'OBJECT_AUTOMATED', 'CCPA_DELETE', 'CCPA_OPT_OUT',
      'LGPD_ACCESS', 'LGPD_DELETE'
    ];

    if (data.requestType && !validRequestTypes.includes(data.requestType)) {
      errors.push('Invalid request type');
    }

    // Calculate auto due date based on jurisdiction and request type
    if (!data.dueDate) {
      autoCalculatedDueDate = this.calculateDueDate(data.requestType, data.jurisdiction);
      warnings.push(`No due date provided, auto-calculated: ${autoCalculatedDueDate.toISOString()}`);
    }

    // Validate due date is in the future
    const dueDateToCheck = data.dueDate || autoCalculatedDueDate;
    if (dueDateToCheck && dueDateToCheck <= new Date()) {
      errors.push('Due date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      autoCalculatedDueDate,
    };
  }

  /**
   * Calculate due date based on jurisdiction and request type
   */
  private static calculateDueDate(requestType: string, jurisdiction?: string): Date {
    const now = new Date();
    let daysToAdd = 30; // Default GDPR timeline

    // Adjust based on jurisdiction
    if (jurisdiction === 'CCPA') {
      daysToAdd = 45; // CCPA allows 45 days
    } else if (jurisdiction === 'LGPD') {
      daysToAdd = 15; // LGPD has shorter timeline
    }

    // Adjust based on request type (some requests might need more time)
    if (requestType === 'DATA_PORTABILITY') {
      daysToAdd += 15; // Extra time for data portability
    }

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate;
  }

  /**
   * Map database record to interface
   */
  private static mapDbToInterface(dbRequest: any): SubjectRightsRequest {
    return {
      id: dbRequest.id,
      requestType: dbRequest.requestType,
      status: dbRequest.status,
      requestedBy: dbRequest.requestedBy,
      requestData: dbRequest.requestData,
      response: dbRequest.response,
      legalBasis: dbRequest.legalBasis,
      jurisdiction: dbRequest.jurisdiction,
      priority: dbRequest.priority,
      dueDate: dbRequest.dueDate?.toISOString(),
      completedAt: dbRequest.completedAt?.toISOString(),
      metadata: dbRequest.metadata,
      tenantId: dbRequest.tenantId,
      createdAt: dbRequest.createdAt.toISOString(),
      updatedAt: dbRequest.updatedAt.toISOString(),
      consentObjects: dbRequest.consentObjects?.map((consent: any) => ({
        id: consent.id,
        consentType: consent.consentType,
        purpose: consent.purpose,
        isRevoked: consent.isRevoked,
      })),
      dataErasureLogs: dbRequest.dataErasureLogs?.map((log: any) => ({
        id: log.id,
        resourceType: log.resourceType,
        erasureMethod: log.erasureMethod,
        erasedAt: log.erasedAt.toISOString(),
      })),
      dataRectificationLogs: dbRequest.dataRectificationLogs?.map((log: any) => ({
        id: log.id,
        resourceType: log.resourceType,
        changeReason: log.changeReason,
        rectifiedAt: log.rectifiedAt.toISOString(),
      })),
    };
  }

  /**
   * Gather personal data for a user (simulated)
   */
  private static async gatherPersonalData(userId: string, tenantId: string): Promise<any> {
    // In a real implementation, this would query various systems
    // For now, we'll return mock data
    
    const consentObjects = await db.consentObject.findMany({
      where: { userId, tenantId },
    });

    return {
      userId,
      tenantId,
      consentObjects: consentObjects.map(consent => ({
        id: consent.id,
        consentType: consent.consentType,
        purpose: consent.purpose,
        grantedAt: consent.grantedAt.toISOString(),
        isRevoked: consent.isRevoked,
        revokedAt: consent.revokedAt?.toISOString(),
      })),
      profile: {
        email: `${userId}@example.com`,
        lastActive: new Date().toISOString(),
        accountCreated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      activitySummary: {
        totalLogins: 42,
        lastLogin: new Date().toISOString(),
        activeSessions: 1,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Revoke related consents for a user
   */
  private static async revokeRelatedConsents(userId: string, tenantId: string): Promise<any[]> {
    const consents = await db.consentObject.findMany({
      where: { userId, tenantId, isRevoked: false },
    });

    const revokedConsents = [];
    for (const consent of consents) {
      const revoked = await db.consentObject.update({
        where: { id: consent.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
      revokedConsents.push(revoked);
    }

    return revokedConsents;
  }

  /**
   * Log data erasure activities
   */
  private static async logDataErasure(requestId: string, userId: string): Promise<any[]> {
    const erasureLogs = [];

    // Log consent object erasure
    const consentErasureLog = await db.dataErasureLog.create({
      data: {
        requestId,
        resourceType: 'CONSENT_OBJECT',
        erasureMethod: 'REVOKE_CONSENT',
        erasedAt: new Date(),
        metadata: {
          userId,
          affectedRecords: 'all_user_consent_objects',
        },
      },
    });
    erasureLogs.push(consentErasureLog);

    // Log profile data erasure (simulated)
    const profileErasureLog = await db.dataErasureLog.create({
      data: {
        requestId,
        resourceType: 'USER_PROFILE',
        erasureMethod: 'ANONYMIZE',
        erasedAt: new Date(),
        metadata: {
          userId,
          fieldsErased: ['email', 'name', 'phone'],
        },
      },
    });
    erasureLogs.push(profileErasureLog);

    return erasureLogs;
  }
}