import { FraudMutationLibrary, FraudTestCase, FraudCategory, MutationResult } from '@/lib/fraud/FraudMutationLibrary';
import { db } from '@/lib/db';

export interface TestCampaignConfig {
  id: string;
  name: string;
  description: string;
  targetAgents: string[];
  testCategories: FraudCategory[];
  mutationTypes: string[];
  schedule: 'nightly' | 'weekly' | 'monthly';
  enabled: boolean;
  maxTestCases: number;
  threshold: {
    minDetectionRate: number;
    maxEvasionRate: number;
    maxConfidenceDrift: number;
  };
  notifications: {
    email: string[];
    webhook?: string;
    slack?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TestExecutionResult {
  campaignId: string;
  executionId: string;
  startTime: Date;
  endTime: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  summary: {
    totalTests: number;
    detectionRate: number;
    evasionRate: number;
    averageConfidenceChange: number;
    executionTime: number;
  };
  resultsByCategory: Record<string, any>;
  resultsByAgent: Record<string, any>;
  weakPoints: string[];
  recommendations: string[];
  passed: boolean;
  error?: string;
}

export interface AdversarialTestReport {
  id: string;
  campaignId: string;
  executionId: string;
  generatedAt: Date;
  reportType: 'SUMMARY' | 'DETAILED' | 'EXECUTIVE';
  format: 'JSON' | 'PDF' | 'HTML';
  content: any;
  metadata: {
    testDuration: number;
    systemsTested: string[];
    anomalies: any[];
    trends: any[];
  };
}

export class NightlyAdversarialTestingService {
  private static instance: NightlyAdversarialTestingService;
  private fraudMutationLibrary: FraudMutationLibrary;
  private testInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TEST_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private activeCampaigns: Map<string, TestCampaignConfig> = new Map();

  private constructor() {
    this.fraudMutationLibrary = FraudMutationLibrary.getInstance();
    this.initializeDefaultCampaigns();
  }

  static getInstance(): NightlyAdversarialTestingService {
    if (!NightlyAdversarialTestingService.instance) {
      NightlyAdversarialTestingService.instance = new NightlyAdversarialTestingService();
    }
    return NightlyAdversarialTestingService.instance;
  }

  /**
   * Initialize default testing campaigns
   */
  private initializeDefaultCampaigns() {
    const defaultCampaigns: TestCampaignConfig[] = [
      {
        id: 'aml_nightly_test',
        name: 'AML Nightly Adversarial Test',
        description: 'Daily adversarial testing for Anti-Money Laundering detection systems',
        targetAgents: ['aml_compliance_agent', 'transaction_monitoring', 'suspicious_activity_reporter'],
        testCategories: [FraudCategory.MONEY_LAUNDERING, FraudCategory.TRANSACTION_FRAUD],
        mutationTypes: [
          'AMOUNT_MANIPULATION',
          'TIMING_VARIATION',
          'STRUCTURE_MODIFICATION',
          'GEOGRAPHIC_SPOOFING'
        ],
        schedule: 'nightly',
        enabled: true,
        maxTestCases: 50,
        threshold: {
          minDetectionRate: 0.85,
          maxEvasionRate: 0.15,
          maxConfidenceDrift: 0.1
        },
        notifications: {
          email: ['compliance-team@company.com', 'security-team@company.com'],
          webhook: process.env.ADVERSARIAL_TEST_WEBHOOK_URL,
          slack: process.env.SLACK_COMPLIANCE_WEBHOOK
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'kyc_nightly_test',
        name: 'KYC Nightly Adversarial Test',
        description: 'Daily adversarial testing for Know Your Customer verification systems',
        targetAgents: ['kyc_verification_agent', 'identity_verification', 'document_validation'],
        testCategories: [FraudCategory.IDENTITY_FRAUD, FraudCategory.SYNTHETIC_IDENTITY],
        mutationTypes: [
          'BEHAVIORAL_PERTURBATION',
          'DATA_OBSCURATION',
          'ADVERSARIAL_NOISE',
          'FEATURE_ENGINEERING'
        ],
        schedule: 'nightly',
        enabled: true,
        maxTestCases: 30,
        threshold: {
          minDetectionRate: 0.90,
          maxEvasionRate: 0.10,
          maxConfidenceDrift: 0.05
        },
        notifications: {
          email: ['kyc-team@company.com', 'fraud-prevention@company.com'],
          slack: process.env.SLACK_FRAUD_WEBHOOK
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'fraud_nightly_test',
        name: 'Fraud Detection Nightly Test',
        description: 'Comprehensive nightly testing for fraud detection systems',
        targetAgents: ['fraud_detection_agent', 'anomaly_detection', 'real_time_scoring'],
        testCategories: [
          FraudCategory.TRANSACTION_FRAUD,
          FraudCategory.CREDIT_CARD_FRAUD,
          FraudCategory.ACCOUNT_TAKEOVER,
          FraudCategory.PAYMENT_FRAUD
        ],
        mutationTypes: [
          'AMOUNT_MANIPULATION',
          'TIMING_VARIATION',
          'GEOGRAPHIC_SPOOFING',
          'BEHAVIORAL_PERTURBATION',
          'CROSS_DOMAIN_TRANSFER',
          'ZERO_DAY_ATTACK'
        ],
        schedule: 'nightly',
        enabled: true,
        maxTestCases: 100,
        threshold: {
          minDetectionRate: 0.80,
          maxEvasionRate: 0.20,
          maxConfidenceDrift: 0.15
        },
        notifications: {
          email: ['fraud-team@company.com', 'engineering-team@company.com', 'executive-summary@company.com'],
          webhook: process.env.ADVERSARIAL_TEST_WEBHOOK_URL,
          slack: process.env.SLACK_SECURITY_WEBHOOK
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultCampaigns.forEach(campaign => {
      this.activeCampaigns.set(campaign.id, campaign);
    });
  }

  /**
   * Start the nightly testing service
   */
  start() {
    if (this.testInterval) {
      console.log('Nightly adversarial testing service is already running');
      return;
    }

    console.log('Starting nightly adversarial testing service...');
    
    // Run testing immediately on start
    this.runAllCampaigns().catch(console.error);
    
    // Schedule regular testing
    this.testInterval = setInterval(() => {
      this.runAllCampaigns().catch(console.error);
    }, this.DEFAULT_TEST_INTERVAL_MS);

    console.log(`Nightly adversarial testing service scheduled to run every ${this.DEFAULT_TEST_INTERVAL_MS / (60 * 60 * 1000)} hours`);
  }

  /**
   * Stop the nightly testing service
   */
  stop() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
      console.log('Nightly adversarial testing service stopped');
    }
  }

  /**
   * Run all enabled campaigns
   */
  private async runAllCampaigns(): Promise<void> {
    try {
      console.log('Running nightly adversarial testing campaigns...');
      
      const enabledCampaigns = Array.from(this.activeCampaigns.values()).filter(c => c.enabled);
      
      for (const campaign of enabledCampaigns) {
        try {
          await this.runCampaign(campaign);
        } catch (error) {
          console.error(`Error running campaign ${campaign.id}:`, error);
          await this.handleCampaignFailure(campaign, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      console.log('Nightly adversarial testing campaigns completed');
    } catch (error) {
      console.error('Error during nightly adversarial testing:', error);
    }
  }

  /**
   * Run a specific testing campaign
   */
  async runCampaign(campaign: TestCampaignConfig): Promise<TestExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    
    console.log(`Starting campaign: ${campaign.name} (${executionId})`);

    try {
      // Generate test cases for the campaign
      const testCases = await this.generateTestCases(campaign);
      
      // Run the adversarial testing campaign
      const campaignResults = await this.fraudMutationLibrary.runAdversarialTestingCampaign(
        testCases,
        campaign.targetAgents
      );

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Check if campaign passed thresholds
      const passed = this.evaluateCampaignResults(campaignResults, campaign.threshold);

      // Generate recommendations
      const recommendations = this.generateRecommendations(campaignResults, campaign.threshold);

      // Create execution result
      const executionResult: TestExecutionResult = {
        campaignId: campaign.id,
        executionId,
        startTime,
        endTime,
        status: 'COMPLETED',
        summary: {
          totalTests: campaignResults.totalTests,
          detectionRate: campaignResults.detectionRate,
          evasionRate: campaignResults.evasionRate,
          averageConfidenceChange: campaignResults.averageConfidenceChange,
          executionTime
        },
        resultsByCategory: campaignResults.resultsByCategory,
        resultsByAgent: this.groupResultsByAgent(campaignResults),
        weakPoints: campaignResults.weakPoints,
        recommendations,
        passed
      };

      // Store execution result
      await this.storeExecutionResult(executionResult);

      // Generate and store reports
      await this.generateReports(executionResult, campaign);

      // Send notifications
      if (!passed || campaignResults.evasionRate > campaign.threshold.maxEvasionRate) {
        await this.sendNotifications(executionResult, campaign);
      }

      console.log(`Campaign ${campaign.name} completed. Passed: ${passed}`);
      return executionResult;

    } catch (error) {
      const endTime = new Date();
      const executionResult: TestExecutionResult = {
        campaignId: campaign.id,
        executionId,
        startTime,
        endTime,
        status: 'FAILED',
        summary: {
          totalTests: 0,
          detectionRate: 0,
          evasionRate: 0,
          averageConfidenceChange: 0,
          executionTime: endTime.getTime() - startTime.getTime()
        },
        resultsByCategory: {},
        resultsByAgent: {},
        weakPoints: [],
        recommendations: [],
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      await this.storeExecutionResult(executionResult);
      throw error;
    }
  }

  /**
   * Generate test cases for a campaign
   */
  private async generateTestCases(campaign: TestCampaignConfig): Promise<FraudTestCase[]> {
    const testCases: FraudTestCase[] = [];

    for (const category of campaign.testCategories) {
      const categoryTestCases = await this.generateCategoryTestCases(category, campaign.maxTestCases / campaign.testCategories.length);
      testCases.push(...categoryTestCases);
    }

    return testCases.slice(0, campaign.maxTestCases);
  }

  /**
   * Generate test cases for a specific fraud category
   */
  private async generateCategoryTestCases(category: FraudCategory, count: number): Promise<FraudTestCase[]> {
    const baseCases = this.getBaseTestCasesForCategory(category);
    const testCases: FraudTestCase[] = [];

    for (let i = 0; i < count; i++) {
      const baseCase = baseCases[Math.floor(Math.random() * baseCases.length)];
      const mutatedCase = await this.mutateBaseCase(baseCase, category);
      testCases.push(mutatedCase);
    }

    return testCases;
  }

  /**
   * Get base test cases for a category
   */
  private getBaseTestCasesForCategory(category: FraudCategory): FraudTestCase[] {
    const baseCases: Record<FraudCategory, FraudTestCase[]> = {
      [FraudCategory.TRANSACTION_FRAUD]: [
        {
          id: 'base_tx_001',
          name: 'High Value Transaction',
          description: 'Large transaction amount testing',
          category: FraudCategory.TRANSACTION_FRAUD,
          input: { amount: 25000, currency: 'USD', merchant: 'luxury_retail' },
          expectedOutput: { isFraud: true },
          mutationType: 'AMOUNT_MANIPULATION' as any,
          severity: 'HIGH' as any,
          confidence: 0.9,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [FraudCategory.IDENTITY_FRAUD]: [
        {
          id: 'base_id_001',
          name: 'Identity Verification Test',
          description: 'Synthetic identity detection',
          category: FraudCategory.IDENTITY_FRAUD,
          input: { ssn: '123-45-6789', dob: '1990-01-01', address: '123 Main St' },
          expectedOutput: { isFraud: true },
          mutationType: 'DATA_OBSCURATION' as any,
          severity: 'HIGH' as any,
          confidence: 0.85,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [FraudCategory.ACCOUNT_TAKEOVER]: [
        {
          id: 'base_ato_001',
          name: 'Account Takeover Test',
          description: 'Unusual login patterns',
          category: FraudCategory.ACCOUNT_TAKEOVER,
          input: { loginAttempts: 20, timeWindow: 300000, locations: ['NY', 'LA', 'TK'] },
          expectedOutput: { isFraud: true },
          mutationType: 'GEOGRAPHIC_SPOOFING' as any,
          severity: 'CRITICAL' as any,
          confidence: 0.95,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [FraudCategory.PAYMENT_FRAUD]: [
        {
          id: 'base_pay_001',
          name: 'Payment Fraud Test',
          description: 'Suspicious payment patterns',
          category: FraudCategory.PAYMENT_FRAUD,
          input: { paymentMethod: 'card', amount: 5000, merchant: 'high_risk' },
          expectedOutput: { isFraud: true },
          mutationType: 'FEATURE_ENGINEERING' as any,
          severity: 'HIGH' as any,
          confidence: 0.8,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [FraudCategory.INSURANCE_FRAUD]: [
        {
          id: 'base_ins_001',
          name: 'Insurance Fraud Test',
          description: 'Suspicious insurance claims',
          category: FraudCategory.INSURANCE_FRAUD,
          input: { claimAmount: 15000, claimType: 'theft', recentClaims: 5 },
          expectedOutput: { isFraud: true },
          mutationType: 'CROSS_DOMAIN_TRANSFER' as any,
          severity: 'MEDIUM' as any,
          confidence: 0.75,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [FraudCategory.MONEY_LAUNDERING]: [
        {
          id: 'base_ml_001',
          name: 'Money Laundering Test',
          description: 'Structured transactions',
          category: FraudCategory.MONEY_LAUNDERING,
          input: { transactions: Array(10).fill({ amount: 9000, interval: '1h' }) },
          expectedOutput: { isFraud: true },
          mutationType: 'STRUCTURE_MODIFICATION' as any,
          severity: 'HIGH' as any,
          confidence: 0.9,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [FraudCategory.CREDIT_CARD_FRAUD]: [
        {
          id: 'base_cc_001',
          name: 'Credit Card Fraud Test',
          description: 'Unusual card usage patterns',
          category: FraudCategory.CREDIT_CARD_FRAUD,
          input: { cardNumber: '4111111111111111', amount: 2000, merchant: 'online' },
          expectedOutput: { isFraud: true },
          mutationType: 'BEHAVIORAL_PERTURBATION' as any,
          severity: 'HIGH' as any,
          confidence: 0.85,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      [FraudCategory.SYNTHETIC_IDENTITY]: [
        {
          id: 'base_syn_001',
          name: 'Synthetic Identity Test',
          description: 'Fabricated identity profiles',
          category: FraudCategory.SYNTHETIC_IDENTITY,
          input: { profile: { name: 'John Doe', ssn: '987-65-4321', creditScore: 800 } },
          expectedOutput: { isFraud: true },
          mutationType: 'ADVERSARIAL_NOISE' as any,
          severity: 'HIGH' as any,
          confidence: 0.8,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };

    return baseCases[category] || [];
  }

  /**
   * Mutate a base case to create variations
   */
  private async mutateBaseCase(baseCase: FraudTestCase, category: FraudCategory): Promise<FraudTestCase> {
    const patterns = this.fraudMutationLibrary.getPatternsByCategory(category);
    if (patterns.length === 0) {
      return baseCase;
    }

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const result = await this.fraudMutationLibrary.applyMutation(baseCase, pattern.id);

    return result.mutatedCase;
  }

  /**
   * Evaluate campaign results against thresholds
   */
  private evaluateCampaignResults(results: any, threshold: TestCampaignConfig['threshold']): boolean {
    return (
      results.detectionRate >= threshold.minDetectionRate &&
      results.evasionRate <= threshold.maxEvasionRate &&
      Math.abs(results.averageConfidenceChange) <= threshold.maxConfidenceDrift
    );
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: any, threshold: TestCampaignConfig['threshold']): string[] {
    const recommendations: string[] = [];

    if (results.detectionRate < threshold.minDetectionRate) {
      recommendations.push(`Detection rate (${(results.detectionRate * 100).toFixed(1)}%) is below threshold (${(threshold.minDetectionRate * 100).toFixed(1)}%). Consider retraining models or adjusting detection thresholds.`);
    }

    if (results.evasionRate > threshold.maxEvasionRate) {
      recommendations.push(`Evasion rate (${(results.evasionRate * 100).toFixed(1)}%) exceeds threshold (${(threshold.maxEvasionRate * 100).toFixed(1)}%). Immediate attention required for identified weak points.`);
    }

    if (Math.abs(results.averageConfidenceChange) > threshold.maxConfidenceDrift) {
      recommendations.push(`Confidence drift (${results.averageConfidenceChange.toFixed(3)}) exceeds threshold (${threshold.maxConfidenceDrift}). Investigate model stability and feature importance changes.`);
    }

    if (results.weakPoints.length > 0) {
      recommendations.push(`Address identified weak points: ${results.weakPoints.join(', ')}. Prioritize security patches and model updates.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All metrics within acceptable thresholds. Continue regular monitoring.');
    }

    return recommendations;
  }

  /**
   * Group results by agent
   */
  private groupResultsByAgent(results: any): Record<string, any> {
    // In a real implementation, this would group results by the specific agent that processed them
    // For now, we'll simulate this grouping
    return {
      'aml_compliance_agent': {
        totalTests: Math.floor(results.totalTests * 0.4),
        detectionRate: results.detectionRate * 1.1,
        evasionRate: results.evasionRate * 0.9
      },
      'fraud_detection_agent': {
        totalTests: Math.floor(results.totalTests * 0.6),
        detectionRate: results.detectionRate * 0.95,
        evasionRate: results.evasionRate * 1.05
      }
    };
  }

  /**
   * Store execution result in database
   */
  private async storeExecutionResult(result: TestExecutionResult): Promise<void> {
    try {
      await db.adversarialTestExecution.create({
        data: {
          id: result.executionId,
          campaignId: result.campaignId,
          status: result.status,
          startTime: result.startTime,
          endTime: result.endTime,
          summary: result.summary,
          resultsByCategory: result.resultsByCategory,
          resultsByAgent: result.resultsByAgent,
          weakPoints: result.weakPoints,
          recommendations: result.recommendations,
          passed: result.passed,
          error: result.error,
          tenantId: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error storing execution result:', error);
    }
  }

  /**
   * Generate reports for the execution
   */
  private async generateReports(result: TestExecutionResult, campaign: TestCampaignConfig): Promise<void> {
    try {
      // Generate summary report
      const summaryReport: AdversarialTestReport = {
        id: `report_summary_${result.executionId}`,
        campaignId: result.campaignId,
        executionId: result.executionId,
        generatedAt: new Date(),
        reportType: 'SUMMARY',
        format: 'JSON',
        content: {
          campaignName: campaign.name,
          summary: result.summary,
          passed: result.passed,
          recommendations: result.recommendations.slice(0, 3) // Top 3 recommendations
        },
        metadata: {
          testDuration: result.summary.executionTime,
          systemsTested: campaign.targetAgents,
          anomalies: result.weakPoints,
          trends: []
        }
      };

      // Store report
      await db.adversarialTestReport.create({
        data: {
          id: summaryReport.id,
          campaignId: summaryReport.campaignId,
          executionId: summaryReport.executionId,
          reportType: summaryReport.reportType,
          format: summaryReport.format,
          content: summaryReport.content,
          metadata: summaryReport.metadata,
          tenantId: 'system',
          createdAt: summaryReport.generatedAt,
          updatedAt: summaryReport.generatedAt
        }
      });

      console.log(`Generated report ${summaryReport.id} for campaign ${campaign.name}`);
    } catch (error) {
      console.error('Error generating reports:', error);
    }
  }

  /**
   * Send notifications for campaign results
   */
  private async sendNotifications(result: TestExecutionResult, campaign: TestCampaignConfig): Promise<void> {
    try {
      const notification = {
        campaignName: campaign.name,
        executionId: result.executionId,
        status: result.passed ? 'PASSED' : 'FAILED',
        summary: result.summary,
        weakPoints: result.weakPoints,
        recommendations: result.recommendations,
        timestamp: new Date().toISOString()
      };

      // Send email notifications
      if (campaign.notifications.email.length > 0) {
        await this.sendEmailNotifications(notification, campaign.notifications.email);
      }

      // Send webhook notifications
      if (campaign.notifications.webhook) {
        await this.sendWebhookNotification(notification, campaign.notifications.webhook);
      }

      // Send Slack notifications
      if (campaign.notifications.slack) {
        await this.sendSlackNotification(notification, campaign.notifications.slack);
      }

      console.log(`Sent notifications for campaign ${campaign.name}`);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Send email notifications (simulated)
   */
  private async sendEmailNotifications(notification: any, recipients: string[]): Promise<void> {
    console.log(`Sending email notifications to: ${recipients.join(', ')}`);
    // In a real implementation, this would integrate with an email service
  }

  /**
   * Send webhook notifications (simulated)
   */
  private async sendWebhookNotification(notification: any, webhookUrl: string): Promise<void> {
    console.log(`Sending webhook notification to: ${webhookUrl}`);
    // In a real implementation, this would make HTTP POST requests
  }

  /**
   * Send Slack notifications (simulated)
   */
  private async sendSlackNotification(notification: any, webhookUrl: string): Promise<void> {
    console.log(`Sending Slack notification to: ${webhookUrl}`);
    // In a real implementation, this would integrate with Slack webhooks
  }

  /**
   * Handle campaign failure
   */
  private async handleCampaignFailure(campaign: TestCampaignConfig, error: string): Promise<void> {
    console.error(`Campaign ${campaign.name} failed: ${error}`);
    
    // Send failure notifications
    const failureNotification = {
      campaignName: campaign.name,
      status: 'FAILED',
      error: error,
      timestamp: new Date().toISOString()
    };

    if (campaign.notifications.email.length > 0) {
      await this.sendEmailNotifications(failureNotification, campaign.notifications.email);
    }
  }

  /**
   * Get all active campaigns
   */
  getActiveCampaigns(): TestCampaignConfig[] {
    return Array.from(this.activeCampaigns.values()).filter(c => c.enabled);
  }

  /**
   * Get campaign by ID
   */
  getCampaignById(id: string): TestCampaignConfig | undefined {
    return this.activeCampaigns.get(id);
  }

  /**
   * Add new campaign
   */
  addCampaign(campaign: TestCampaignConfig): void {
    this.activeCampaigns.set(campaign.id, campaign);
    console.log(`Added campaign: ${campaign.name}`);
  }

  /**
   * Update campaign
   */
  updateCampaign(id: string, updates: Partial<TestCampaignConfig>): void {
    const campaign = this.activeCampaigns.get(id);
    if (campaign) {
      const updatedCampaign = { ...campaign, ...updates, updatedAt: new Date() };
      this.activeCampaigns.set(id, updatedCampaign);
      console.log(`Updated campaign: ${campaign.name}`);
    }
  }

  /**
   * Enable/disable campaign
   */
  toggleCampaign(id: string, enabled: boolean): void {
    const campaign = this.activeCampaigns.get(id);
    if (campaign) {
      campaign.enabled = enabled;
      campaign.updatedAt = new Date();
      this.activeCampaigns.set(id, campaign);
      console.log(`${enabled ? 'Enabled' : 'Disabled'} campaign: ${campaign.name}`);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.testInterval !== null,
      activeCampaigns: this.getActiveCampaigns().length,
      totalCampaigns: this.activeCampaigns.size,
      nextRun: this.testInterval ? 
        new Date(Date.now() + this.DEFAULT_TEST_INTERVAL_MS).toISOString() : 
        null
    };
  }

  /**
   * Run campaign manually
   */
  async runCampaignManually(campaignId: string): Promise<TestExecutionResult> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    return await this.runCampaign(campaign);
  }
}