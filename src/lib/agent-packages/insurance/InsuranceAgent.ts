import { db } from '@/lib/db';
import { AgentPackage, AgentExecutionContext } from '../agent-package-framework';

export interface InsuranceConfig {
  tenantId: string;
  underwritingEnabled: boolean;
  claimsProcessingEnabled: boolean;
  riskModelingEnabled: boolean;
  policyManagementEnabled: boolean;
}

export interface PolicyApplication {
  id: string;
  applicantId: string;
  policyType: 'LIFE' | 'HEALTH' | 'AUTO' | 'HOME' | 'BUSINESS';
  coverageAmount: number;
  premium: number;
  deductible: number;
  term: number; // in years
  applicantInfo: {
    age: number;
    gender: string;
    healthStatus?: string;
    drivingRecord?: string;
    propertyDetails?: any;
    businessDetails?: any;
  };
  riskFactors: string[];
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  createdAt: Date;
}

export interface UnderwritingResult {
  applicationId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  premiumAdjustment: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  decision: 'APPROVE' | 'REJECT' | 'REFER';
  conditions?: string[];
}

export interface Claim {
  id: string;
  policyId: string;
  claimantId: string;
  claimType: 'DEATH' | 'HEALTH' | 'ACCIDENT' | 'PROPERTY' | 'LIABILITY';
  incidentDate: Date;
  reportedDate: Date;
  description: string;
  claimedAmount: number;
  supportingDocuments: string[];
  status: 'PENDING' | 'UNDER_REVIEW' | 'INVESTIGATING' | 'APPROVED' | 'REJECTED' | 'PAID';
  assessment?: ClaimAssessment;
  createdAt: Date;
}

export interface ClaimAssessment {
  claimId: string;
  coverageDetermination: 'COVERED' | 'PARTIALLY_COVERED' | 'NOT_COVERED';
  approvedAmount: number;
  deductible: number;
  payoutAmount: number;
  investigationNotes?: string;
  requiredDocumentation?: string[];
  recommendations: string[];
}

export interface RiskModel {
  id: string;
  policyType: string;
  riskCategory: string;
  modelType: 'STATISTICAL' | 'MACHINE_LEARNING' | 'HYBRID';
  factors: string[];
  weights: number[];
  accuracy: number;
  lastUpdated: Date;
}

export class InsuranceAgent implements AgentPackage {
  private config: InsuranceConfig;
  private name = 'Insurance Agent';
  private version = '1.0.0';

  constructor(config: InsuranceConfig) {
    this.config = config;
  }

  getName(): string {
    return this.name;
  }

  getVersion(): string {
    return this.version;
  }

  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);
    
    // Create agent record in database
    await db.agent.create({
      data: {
        name: this.name,
        version: this.version,
        type: 'INSURANCE',
        tenantId: this.config.tenantId,
        config: this.config,
        status: 'ACTIVE'
      }
    });
  }

  async execute(context: AgentExecutionContext): Promise<any> {
    const { task, data, metadata } = context;

    switch (task) {
      case 'UNDERWRITE_POLICY':
        return await this.underwritePolicy(data.application);
      
      case 'PROCESS_CLAIM':
        return await this.processClaim(data.claim);
      
      case 'ASSESS_RISK':
        return await this.assessRisk(data.applicationId);
      
      case 'MANAGE_POLICY':
        return await this.managePolicy(data.policyId, data.action, data.data);
      
      case 'GENERATE_QUOTE':
        return await this.generateQuote(data.applicantInfo, data.policyType);
      
      case 'ANALYZE_CLAIM_TRENDS':
        return await this.analyzeClaimTrends(data.filters);
      
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  private async underwritePolicy(application: PolicyApplication): Promise<any> {
    console.log(`Underwriting policy application ${application.id}`);

    // Create application record
    const policyApplication = await db.policyApplication.create({
      data: {
        id: application.id,
        applicantId: application.applicantId,
        policyType: application.policyType,
        coverageAmount: application.coverageAmount,
        premium: application.premium,
        deductible: application.deductible,
        term: application.term,
        applicantInfo: application.applicantInfo,
        riskFactors: application.riskFactors,
        status: 'PENDING',
        createdAt: application.createdAt,
        tenantId: this.config.tenantId
      }
    });

    // Execute workflow steps
    const workflowSteps = [];

    if (this.config.riskModelingEnabled) {
      const riskAssessment = await this.assessRisk(application.id);
      workflowSteps.push({
        step: 'RISK_ASSESSMENT',
        result: riskAssessment,
        timestamp: new Date()
      });
    }

    if (this.config.underwritingEnabled) {
      const underwritingResult = await this.performUnderwriting(application.id);
      workflowSteps.push({
        step: 'UNDERWRITING',
        result: underwritingResult,
        timestamp: new Date()
      });

      // Update application status based on underwriting result
      const newStatus = underwritingResult.decision === 'APPROVE' ? 'APPROVED' :
                       underwritingResult.decision === 'REJECT' ? 'REJECTED' : 'UNDER_REVIEW';
      
      await db.policyApplication.update({
        where: { id: application.id },
        data: { status: newStatus }
      });
    }

    if (this.config.policyManagementEnabled && policyApplication.status === 'APPROVED') {
      const policyIssuance = await this.issuePolicy(application.id);
      workflowSteps.push({
        step: 'POLICY_ISSUANCE',
        result: policyIssuance,
        timestamp: new Date()
      });
    }

    return {
      applicationId: application.id,
      status: policyApplication.status,
      workflowSteps,
      processedAt: new Date()
    };
  }

  private async processClaim(claim: Claim): Promise<any> {
    console.log(`Processing claim ${claim.id}`);

    // Create claim record
    const claimRecord = await db.claim.create({
      data: {
        id: claim.id,
        policyId: claim.policyId,
        claimantId: claim.claimantId,
        claimType: claim.claimType,
        incidentDate: claim.incidentDate,
        reportedDate: claim.reportedDate,
        description: claim.description,
        claimedAmount: claim.claimedAmount,
        supportingDocuments: claim.supportingDocuments,
        status: 'PENDING',
        createdAt: claim.createdAt,
        tenantId: this.config.tenantId
      }
    });

    // Execute workflow steps
    const workflowSteps = [];

    // Initial validation
    const validation = await this.validateClaim(claim);
    workflowSteps.push({
      step: 'CLAIM_VALIDATION',
      result: validation,
      timestamp: new Date()
    });

    if (!validation.valid) {
      await db.claim.update({
        where: { id: claim.id },
        data: { status: 'REJECTED' }
      });
      
      return {
        claimId: claim.id,
        status: 'REJECTED',
        reason: validation.reason,
        workflowSteps,
        processedAt: new Date()
      };
    }

    // Claim assessment
    if (this.config.claimsProcessingEnabled) {
      const assessment = await this.assessClaim(claim);
      workflowSteps.push({
        step: 'CLAIM_ASSESSMENT',
        result: assessment,
        timestamp: new Date()
      });

      // Update claim with assessment
      await db.claim.update({
        where: { id: claim.id },
        data: {
          assessment,
          status: assessment.coverageDetermination === 'NOT_COVERED' ? 'REJECTED' : 'UNDER_REVIEW'
        }
      });
    }

    // Investigation if needed
    if (claimRecord.status === 'UNDER_REVIEW' && claim.claimedAmount > 10000) {
      const investigation = await this.investigateClaim(claim.id);
      workflowSteps.push({
        step: 'CLAIM_INVESTIGATION',
        result: investigation,
        timestamp: new Date()
      });
    }

    // Final decision
    const finalDecision = await this.makeClaimDecision(claim.id);
    workflowSteps.push({
      step: 'CLAIM_DECISION',
      result: finalDecision,
      timestamp: new Date()
    });

    await db.claim.update({
      where: { id: claim.id },
      data: { status: finalDecision.status }
    });

    return {
      claimId: claim.id,
      status: finalDecision.status,
      approvedAmount: finalDecision.approvedAmount,
      workflowSteps,
      processedAt: new Date()
    };
  }

  private async assessRisk(applicationId: string): Promise<any> {
    console.log(`Assessing risk for application ${applicationId}`);

    // Get application data
    const application = await db.policyApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Calculate risk score based on policy type and applicant info
    let riskScore = 50; // Base risk score
    const factors: string[] = [];

    switch (application.policyType) {
      case 'LIFE':
        riskScore = this.calculateLifeInsuranceRisk(application.applicantInfo);
        break;
      case 'HEALTH':
        riskScore = this.calculateHealthInsuranceRisk(application.applicantInfo);
        break;
      case 'AUTO':
        riskScore = this.calculateAutoInsuranceRisk(application.applicantInfo);
        break;
      case 'HOME':
        riskScore = this.calculateHomeInsuranceRisk(application.applicantInfo);
        break;
      case 'BUSINESS':
        riskScore = this.calculateBusinessInsuranceRisk(application.applicantInfo);
        break;
    }

    // Determine risk level
    let riskLevel = 'LOW';
    if (riskScore >= 80) riskLevel = 'VERY_HIGH';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';

    // Store risk assessment
    const riskAssessment = await db.riskAssessment.create({
      data: {
        applicationId,
        riskScore,
        riskLevel,
        factors,
        tenantId: this.config.tenantId
      }
    });

    return {
      applicationId,
      riskScore,
      riskLevel,
      factors,
      assessmentId: riskAssessment.id
    };
  }

  private async performUnderwriting(applicationId: string): Promise<UnderwritingResult> {
    console.log(`Performing underwriting for application ${applicationId}`);

    // Get application and risk assessment
    const application = await db.policyApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const riskAssessment = await db.riskAssessment.findUnique({
      where: { applicationId }
    });

    // Calculate underwriting decision
    let decision: UnderwritingResult['decision'] = 'APPROVE';
    let premiumAdjustment = 0;
    const factors = {
      positive: [] as string[],
      negative: [] as string[]
    };
    const conditions: string[] = [];

    // Base decision on risk score
    if (riskAssessment?.riskScore >= 80) {
      decision = 'REJECT';
      factors.negative.push('Very high risk score');
    } else if (riskAssessment?.riskScore >= 60) {
      decision = 'REFER';
      premiumAdjustment = 50; // 50% increase
      factors.negative.push('High risk score requires review');
      conditions.push('Medical examination required');
      conditions.push('Additional documentation needed');
    } else if (riskAssessment?.riskScore >= 40) {
      premiumAdjustment = 25; // 25% increase
      factors.negative.push('Moderate risk score');
    } else {
      factors.positive.push('Low risk score');
      premiumAdjustment = -10; // 10% discount
    }

    // Additional factors based on policy type
    switch (application.policyType) {
      case 'LIFE':
        if (application.applicantInfo.age > 50) {
          factors.negative.push('Age over 50');
          premiumAdjustment += 20;
        }
        break;
      case 'AUTO':
        if (application.applicantInfo.drivingRecord === 'EXCELLENT') {
          factors.positive.push('Excellent driving record');
          premiumAdjustment -= 15;
        }
        break;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (premiumAdjustment > 0) {
      recommendations.push('Consider higher deductible for lower premium');
      recommendations.push('Wellness programs may reduce premiums');
    }

    const underwritingResult: UnderwritingResult = {
      applicationId,
      riskScore: riskAssessment?.riskScore || 0,
      riskLevel: riskAssessment?.riskLevel || 'LOW',
      premiumAdjustment,
      factors,
      recommendations,
      decision,
      conditions: conditions.length > 0 ? conditions : undefined
    };

    // Store underwriting result
    await db.underwritingResult.create({
      data: {
        applicationId,
        riskScore: underwritingResult.riskScore,
        riskLevel: underwritingResult.riskLevel,
        premiumAdjustment,
        factors: underwritingResult.factors,
        recommendations: underwritingResult.recommendations,
        decision: underwritingResult.decision,
        conditions: underwritingResult.conditions,
        tenantId: this.config.tenantId
      }
    });

    return underwritingResult;
  }

  private async managePolicy(policyId: string, action: string, data: any): Promise<any> {
    console.log(`Managing policy ${policyId} with action ${action}`);

    switch (action) {
      case 'UPDATE_COVERAGE':
        return await this.updatePolicyCoverage(policyId, data);
      
      case 'CANCEL_POLICY':
        return await this.cancelPolicy(policyId, data.reason);
      
      case 'RENEW_POLICY':
        return await this.renewPolicy(policyId, data.renewalTerms);
      
      case 'ADD_ENDORSEMENT':
        return await this.addEndorsement(policyId, data.endorsement);
      
      default:
        throw new Error(`Unknown policy management action: ${action}`);
    }
  }

  private async generateQuote(applicantInfo: any, policyType: string): Promise<any> {
    console.log(`Generating quote for ${policyType} insurance`);

    // Calculate base premium based on policy type
    let basePremium = 0;
    switch (policyType) {
      case 'LIFE':
        basePremium = 100;
        break;
      case 'HEALTH':
        basePremium = 200;
        break;
      case 'AUTO':
        basePremium = 150;
        break;
      case 'HOME':
        basePremium = 80;
        break;
      case 'BUSINESS':
        basePremium = 300;
        break;
    }

    // Adjust premium based on applicant info
    let premiumMultiplier = 1.0;

    // Age factor
    if (applicantInfo.age < 25) premiumMultiplier += 0.5;
    else if (applicantInfo.age > 60) premiumMultiplier += 0.3;

    // Health factor for life/health insurance
    if (policyType === 'LIFE' || policyType === 'HEALTH') {
      if (applicantInfo.healthStatus === 'EXCELLENT') premiumMultiplier -= 0.2;
      else if (applicantInfo.healthStatus === 'POOR') premiumMultiplier += 0.8;
    }

    // Driving record for auto insurance
    if (policyType === 'AUTO') {
      if (applicantInfo.drivingRecord === 'EXCELLENT') premiumMultiplier -= 0.3;
      else if (applicantInfo.drivingRecord === 'POOR') premiumMultiplier += 1.0;
    }

    const finalPremium = Math.round(basePremium * premiumMultiplier);
    const quoteId = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      quoteId,
      policyType,
      basePremium,
      finalPremium,
      multiplier: premiumMultiplier,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      generatedAt: new Date()
    };
  }

  private async analyzeClaimTrends(filters: any): Promise<any> {
    console.log('Analyzing claim trends');

    // Get claims data
    const claims = await db.claim.findMany({
      where: {
        tenantId: this.config.tenantId,
        ...(filters.policyType && { policyType: filters.policyType }),
        ...(filters.dateRange && {
          createdAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        })
      }
    });

    // Analyze trends
    const totalClaims = claims.length;
    const totalAmount = claims.reduce((sum, claim) => sum + claim.claimedAmount, 0);
    const averageClaimAmount = totalAmount / totalClaims || 0;

    const byClaimType = claims.reduce((acc, claim) => {
      acc[claim.claimType] = (acc[claim.claimType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyTrends = claims.reduce((acc, claim) => {
      const month = new Date(claim.createdAt).toISOString().substr(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClaims,
      totalAmount,
      averageClaimAmount,
      byClaimType,
      byStatus,
      monthlyTrends,
      analyzedAt: new Date()
    };
  }

  // Helper methods
  private async validateClaim(claim: Claim): Promise<{ valid: boolean; reason?: string }> {
    // Check if policy exists and is active
    const policy = await db.policy.findUnique({
      where: { id: claim.policyId }
    });

    if (!policy) {
      return { valid: false, reason: 'Policy not found' };
    }

    if (policy.status !== 'ACTIVE') {
      return { valid: false, reason: 'Policy is not active' };
    }

    // Check if claim is within policy period
    if (claim.incidentDate < policy.effectiveDate || claim.incidentDate > policy.expiryDate) {
      return { valid: false, reason: 'Claim incident outside policy period' };
    }

    // Check if claim is reported within time limit
    const daysSinceIncident = Math.floor((Date.now() - claim.incidentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceIncident > 30) {
      return { valid: false, reason: 'Claim reported too late' };
    }

    return { valid: true };
  }

  private async assessClaim(claim: Claim): Promise<ClaimAssessment> {
    // Get policy details
    const policy = await db.policy.findUnique({
      where: { id: claim.policyId }
    });

    if (!policy) {
      throw new Error(`Policy ${claim.policyId} not found`);
    }

    // Determine coverage
    let coverageDetermination: ClaimAssessment['coverageDetermination'] = 'COVERED';
    let approvedAmount = claim.claimedAmount;
    const requiredDocumentation: string[] = [];

    // Check coverage limits
    if (claim.claimedAmount > policy.coverageLimit) {
      coverageDetermination = 'PARTIALLY_COVERED';
      approvedAmount = policy.coverageLimit;
    }

    // Check deductible
    const deductible = Math.min(policy.deductible, approvedAmount);
    const payoutAmount = approvedAmount - deductible;

    // Check for required documentation based on claim type
    switch (claim.claimType) {
      case 'PROPERTY':
        requiredDocumentation.push('Police report', 'Photos of damage', 'Repair estimates');
        break;
      case 'HEALTH':
        requiredDocumentation.push('Medical records', 'Doctor\'s report', 'Bills and receipts');
        break;
      case 'ACCIDENT':
        requiredDocumentation.push('Accident report', 'Witness statements', 'Medical documentation');
        break;
    }

    const assessment: ClaimAssessment = {
      claimId: claim.id,
      coverageDetermination,
      approvedAmount,
      deductible,
      payoutAmount,
      requiredDocumentation,
      recommendations: [
        'Submit all required documentation promptly',
        'Keep copies of all submitted documents',
        'Contact claims adjuster for any questions'
      ]
    };

    return assessment;
  }

  private async investigateClaim(claimId: string): Promise<any> {
    // Simulate claim investigation
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      claimId,
      investigationStatus: 'COMPLETED',
      findings: 'Claim investigation completed. No fraud detected.',
      recommendations: ['Proceed with standard claim processing'],
      investigatedAt: new Date()
    };
  }

  private async makeClaimDecision(claimId: string): Promise<any> {
    const claim = await db.claim.findUnique({
      where: { id: claimId },
      include: { assessment: true }
    });

    if (!claim) {
      throw new Error(`Claim ${claimId} not found`);
    }

    let status: Claim['status'] = 'APPROVED';
    let approvedAmount = claim.assessment?.approvedAmount || 0;

    if (claim.assessment?.coverageDetermination === 'NOT_COVERED') {
      status = 'REJECTED';
      approvedAmount = 0;
    }

    return {
      status,
      approvedAmount,
      decisionDate: new Date()
    };
  }

  private async issuePolicy(applicationId: string): Promise<any> {
    const application = await db.policyApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const policyId = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const policy = await db.policy.create({
      data: {
        id: policyId,
        applicationId,
        policyType: application.policyType,
        coverageAmount: application.coverageAmount,
        premium: application.premium,
        deductible: application.deductible,
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + application.term * 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        tenantId: this.config.tenantId
      }
    });

    return {
      policyId: policy.id,
      status: 'ISSUED',
      issuedAt: new Date()
    };
  }

  private async updatePolicyCoverage(policyId: string, data: any): Promise<any> {
    // Update policy coverage
    await db.policy.update({
      where: { id: policyId },
      data: {
        coverageAmount: data.newCoverageAmount,
        premium: data.newPremium,
        updatedAt: new Date()
      }
    });

    return {
      policyId,
      action: 'COVERAGE_UPDATED',
      updatedAt: new Date()
    };
  }

  private async cancelPolicy(policyId: string, reason: string): Promise<any> {
    await db.policy.update({
      where: { id: policyId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date()
      }
    });

    return {
      policyId,
      action: 'CANCELLED',
      reason,
      cancelledAt: new Date()
    };
  }

  private async renewPolicy(policyId: string, renewalTerms: any): Promise<any> {
    await db.policy.update({
      where: { id: policyId },
      data: {
        expiryDate: new Date(Date.now() + renewalTerms.term * 365 * 24 * 60 * 60 * 1000),
        premium: renewalTerms.newPremium,
        renewedAt: new Date()
      }
    });

    return {
      policyId,
      action: 'RENEWED',
      renewedAt: new Date()
    };
  }

  private async addEndorsement(policyId: string, endorsement: any): Promise<any> {
    await db.policyEndorsement.create({
      data: {
        policyId,
        type: endorsement.type,
        description: endorsement.description,
        effectiveDate: endorsement.effectiveDate,
        premiumAdjustment: endorsement.premiumAdjustment,
        tenantId: this.config.tenantId
      }
    });

    return {
      policyId,
      action: 'ENDORSEMENT_ADDED',
      endorsementType: endorsement.type,
      addedAt: new Date()
    };
  }

  // Risk calculation methods
  private calculateLifeInsuranceRisk(applicantInfo: any): number {
    let risk = 50;
    
    // Age factor
    if (applicantInfo.age > 60) risk += 30;
    else if (applicantInfo.age > 50) risk += 20;
    else if (applicantInfo.age < 30) risk -= 10;
    
    // Health factor
    if (applicantInfo.healthStatus === 'EXCELLENT') risk -= 20;
    else if (applicantInfo.healthStatus === 'GOOD') risk -= 10;
    else if (applicantInfo.healthStatus === 'FAIR') risk += 10;
    else if (applicantInfo.healthStatus === 'POOR') risk += 30;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateHealthInsuranceRisk(applicantInfo: any): number {
    let risk = 50;
    
    // Age factor
    if (applicantInfo.age > 55) risk += 25;
    else if (applicantInfo.age > 45) risk += 15;
    
    // Health factor
    if (applicantInfo.healthStatus === 'EXCELLENT') risk -= 25;
    else if (applicantInfo.healthStatus === 'GOOD') risk -= 10;
    else if (applicantInfo.healthStatus === 'FAIR') risk += 15;
    else if (applicantInfo.healthStatus === 'POOR') risk += 35;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateAutoInsuranceRisk(applicantInfo: any): number {
    let risk = 50;
    
    // Age factor
    if (applicantInfo.age < 25) risk += 30;
    else if (applicantInfo.age < 30) risk += 15;
    
    // Driving record
    if (applicantInfo.drivingRecord === 'EXCELLENT') risk -= 25;
    else if (applicantInfo.drivingRecord === 'GOOD') risk -= 10;
    else if (applicantInfo.drivingRecord === 'AVERAGE') risk += 5;
    else if (applicantInfo.drivingRecord === 'POOR') risk += 30;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateHomeInsuranceRisk(applicantInfo: any): number {
    let risk = 50;
    
    // Property age
    if (applicantInfo.propertyDetails?.age > 30) risk += 20;
    else if (applicantInfo.propertyDetails?.age > 20) risk += 10;
    else if (applicantInfo.propertyDetails?.age < 5) risk -= 10;
    
    // Property type
    if (applicantInfo.propertyDetails?.type === 'CONDO') risk -= 10;
    else if (applicantInfo.propertyDetails?.type === 'MOBILE_HOME') risk += 15;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateBusinessInsuranceRisk(applicantInfo: any): number {
    let risk = 50;
    
    // Business type
    const highRiskTypes = ['CONSTRUCTION', 'MANUFACTURING', 'TRANSPORTATION'];
    const mediumRiskTypes = ['RETAIL', 'RESTAURANT', 'HEALTHCARE'];
    
    if (highRiskTypes.includes(applicantInfo.businessDetails?.type)) risk += 30;
    else if (mediumRiskTypes.includes(applicantInfo.businessDetails?.type)) risk += 15;
    else risk -= 10;
    
    // Business age
    if (applicantInfo.businessDetails?.age < 2) risk += 25;
    else if (applicantInfo.businessDetails?.age < 5) risk += 10;
    else if (applicantInfo.businessDetails?.age > 10) risk -= 15;
    
    return Math.max(0, Math.min(100, risk));
  }
}