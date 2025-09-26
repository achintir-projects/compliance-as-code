import { db } from '@/lib/db';

export interface ConsentData {
  id?: string;
  knowledgeObjectId?: string;
  decisionBundleId?: string;
  consentType: 'DATA_PROCESSING' | 'DECISION_MAKING' | 'STORAGE' | 'SHARING' | 'ANALYTICS';
  purpose: string;
  legalBasis: string;
  retentionPeriod?: string;
  expiryDate?: Date;
  metadata?: any;
  tenantId?: string;
}

export interface ConsentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConsentService {
  /**
   * Validate consent data before creation or update
   */
  static validateConsentData(data: ConsentData): ConsentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.consentType) {
      errors.push('Consent type is required');
    }

    if (!data.purpose || data.purpose.trim().length === 0) {
      errors.push('Purpose is required');
    }

    if (!data.legalBasis || data.legalBasis.trim().length === 0) {
      errors.push('Legal basis is required');
    }

    // At least one link validation
    if (!data.knowledgeObjectId && !data.decisionBundleId) {
      errors.push('At least one of knowledgeObjectId or decisionBundleId must be provided');
    }

    // Retention period validation (ISO 8601 duration format)
    if (data.retentionPeriod && !data.retentionPeriod.match(/^P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?$/)) {
      errors.push('Invalid retention period format. Use ISO 8601 duration (e.g., P1Y, P6M, P30D)');
    }

    // Expiry date validation
    if (data.expiryDate && data.expiryDate <= new Date()) {
      warnings.push('Expiry date is in the past');
    }

    // Legal basis validation for GDPR compliance
    const validLegalBases = [
      'GDPR Article 6(1)(a)', // Consent
      'GDPR Article 6(1)(b)', // Contract
      'GDPR Article 6(1)(c)', // Legal obligation
      'GDPR Article 6(1)(d)', // Vital interests
      'GDPR Article 6(1)(e)', // Public task
      'GDPR Article 6(1)(f)', // Legitimate interests
      'CCPA Section 1798.100(b)', // CCPA compliance
      'HIPAA Authorization', // HIPAA compliance
    ];

    if (data.legalBasis && !validLegalBases.some(basis => data.legalBasis!.includes(basis))) {
      warnings.push('Legal basis may not be recognized. Please verify compliance requirements.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a new consent object
   */
  static async createConsent(data: ConsentData) {
    const validation = this.validateConsentData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if linked knowledge object exists
    if (data.knowledgeObjectId) {
      const knowledgeObject = await db.knowledgeObject.findUnique({
        where: { id: data.knowledgeObjectId }
      });
      if (!knowledgeObject) {
        throw new Error('Knowledge object not found');
      }
    }

    // Check if linked decision bundle exists
    if (data.decisionBundleId) {
      const decisionBundle = await db.decisionBundle.findUnique({
        where: { id: data.decisionBundleId }
      });
      if (!decisionBundle) {
        throw new Error('Decision bundle not found');
      }
    }

    const consent = await db.consentObject.create({
      data: {
        knowledgeObjectId: data.knowledgeObjectId,
        decisionBundleId: data.decisionBundleId,
        consentType: data.consentType,
        purpose: data.purpose,
        legalBasis: data.legalBasis,
        retentionPeriod: data.retentionPeriod,
        expiryDate: data.expiryDate,
        metadata: data.metadata || {},
        tenantId: data.tenantId || 'system'
      },
      include: {
        knowledgeObject: {
          select: {
            id: true,
            topic: true,
            category: true,
            confidence: true,
            country: true,
            regulationType: true
          }
        },
        decisionBundle: {
          select: {
            id: true,
            agentId: true,
            timestamp: true,
            jurisdiction: true,
            residencyRegion: true
          }
        }
      }
    });

    // Log consent creation for audit purposes
    await db.auditLog.create({
      data: {
        type: 'CONSENT_CREATED',
        resourceId: consent.id,
        resourceType: 'ConsentObject',
        action: 'create',
        after: consent,
        metadata: {
          validationWarnings: validation.warnings,
          createdAt: new Date().toISOString()
        },
        tenantId: consent.tenantId
      }
    });

    return consent;
  }

  /**
   * Update an existing consent object
   */
  static async updateConsent(id: string, data: Partial<ConsentData>) {
    // Check if consent exists and is not revoked
    const existingConsent = await db.consentObject.findUnique({
      where: { id }
    });

    if (!existingConsent) {
      throw new Error('Consent object not found');
    }

    if (existingConsent.isRevoked) {
      throw new Error('Cannot update revoked consent');
    }

    const validation = this.validateConsentData({ ...existingConsent, ...data });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const updateData: any = {};
    if (data.knowledgeObjectId !== undefined) updateData.knowledgeObjectId = data.knowledgeObjectId;
    if (data.decisionBundleId !== undefined) updateData.decisionBundleId = data.decisionBundleId;
    if (data.consentType !== undefined) updateData.consentType = data.consentType;
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.legalBasis !== undefined) updateData.legalBasis = data.legalBasis;
    if (data.retentionPeriod !== undefined) updateData.retentionPeriod = data.retentionPeriod;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updatedConsent = await db.consentObject.update({
      where: { id },
      data: updateData,
      include: {
        knowledgeObject: {
          select: {
            id: true,
            topic: true,
            category: true,
            confidence: true,
            country: true,
            regulationType: true
          }
        },
        decisionBundle: {
          select: {
            id: true,
            agentId: true,
            timestamp: true,
            jurisdiction: true,
            residencyRegion: true
          }
        }
      }
    });

    // Log consent update for audit purposes
    await db.auditLog.create({
      data: {
        type: 'CONSENT_UPDATED',
        resourceId: id,
        resourceType: 'ConsentObject',
        action: 'update',
        before: existingConsent,
        after: updatedConsent,
        metadata: {
          validationWarnings: validation.warnings,
          updatedAt: new Date().toISOString()
        },
        tenantId: existingConsent.tenantId
      }
    });

    return updatedConsent;
  }

  /**
   * Revoke a consent object
   */
  static async revokeConsent(id: string, reason?: string) {
    const existingConsent = await db.consentObject.findUnique({
      where: { id }
    });

    if (!existingConsent) {
      throw new Error('Consent object not found');
    }

    if (existingConsent.isRevoked) {
      throw new Error('Consent is already revoked');
    }

    const revokedConsent = await db.consentObject.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      },
      include: {
        knowledgeObject: {
          select: {
            id: true,
            topic: true,
            category: true
          }
        },
        decisionBundle: {
          select: {
            id: true,
            agentId: true,
            timestamp: true
          }
        }
      }
    });

    // Log consent revocation for audit purposes
    await db.auditLog.create({
      data: {
        type: 'CONSENT_REVOKED',
        resourceId: id,
        resourceType: 'ConsentObject',
        action: 'revoke',
        before: existingConsent,
        after: revokedConsent,
        metadata: {
          reason: reason || 'User requested revocation',
          revokedAt: new Date().toISOString()
        },
        tenantId: existingConsent.tenantId
      }
    });

    return revokedConsent;
  }

  /**
   * Get consent objects by tenant with filtering
   */
  static async getConsentsByTenant(
    tenantId: string,
    filters?: {
      consentType?: string;
      isRevoked?: boolean;
      knowledgeObjectId?: string;
      decisionBundleId?: string;
      isExpired?: boolean;
    }
  ) {
    const where: any = { tenantId };

    if (filters) {
      if (filters.consentType) where.consentType = filters.consentType;
      if (filters.isRevoked !== undefined) where.isRevoked = filters.isRevoked;
      if (filters.knowledgeObjectId) where.knowledgeObjectId = filters.knowledgeObjectId;
      if (filters.decisionBundleId) where.decisionBundleId = filters.decisionBundleId;
      
      if (filters.isExpired) {
        where.expiryDate = {
          lt: new Date()
        };
      }
    }

    return await db.consentObject.findMany({
      where,
      include: {
        knowledgeObject: {
          select: {
            id: true,
            topic: true,
            category: true,
            confidence: true,
            country: true,
            regulationType: true
          }
        },
        decisionBundle: {
          select: {
            id: true,
            agentId: true,
            timestamp: true,
            jurisdiction: true,
            residencyRegion: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Check if consent is valid and active
   */
  static async isConsentActive(id: string): Promise<boolean> {
    const consent = await db.consentObject.findUnique({
      where: { id }
    });

    if (!consent) return false;
    if (consent.isRevoked) return false;
    if (consent.expiryDate && consent.expiryDate < new Date()) return false;

    return true;
  }

  /**
   * Get expired consents for cleanup
   */
  static async getExpiredConsents(tenantId?: string) {
    const where: any = {
      expiryDate: {
        lt: new Date()
      },
      isRevoked: false
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return await db.consentObject.findMany({
      where,
      include: {
        knowledgeObject: {
          select: {
            id: true,
            topic: true,
            category: true
          }
        },
        decisionBundle: {
          select: {
            id: true,
            agentId: true,
            timestamp: true
          }
        }
      }
    });
  }

  /**
   * Auto-revoke expired consents
   */
  static async autoRevokeExpiredConsents(tenantId?: string) {
    const expiredConsents = await this.getExpiredConsents(tenantId);
    const revokedConsents = [];

    for (const consent of expiredConsents) {
      try {
        const revoked = await this.revokeConsent(consent.id, 'Auto-revoked due to expiry');
        revokedConsents.push(revoked);
      } catch (error) {
        console.error(`Failed to auto-revoke consent ${consent.id}:`, error);
      }
    }

    return revokedConsents;
  }

  /**
   * Get consent statistics
   */
  static async getConsentStats(tenantId: string) {
    const total = await db.consentObject.count({
      where: { tenantId }
    });

    const active = await db.consentObject.count({
      where: { 
        tenantId,
        isRevoked: false,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      }
    });

    const revoked = await db.consentObject.count({
      where: { 
        tenantId,
        isRevoked: true
      }
    });

    const expired = await db.consentObject.count({
      where: { 
        tenantId,
        isRevoked: false,
        expiryDate: {
          lt: new Date()
        }
      }
    });

    const byType = await db.consentObject.groupBy({
      by: ['consentType'],
      where: { tenantId },
      _count: { consentType: true }
    });

    return {
      total,
      active,
      revoked,
      expired,
      byType: byType.reduce((acc, item) => {
        acc[item.consentType] = item._count.consentType;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}