import { db } from '@/lib/db';
import { AgentPackage, AgentExecutionContext } from '../agent-package-framework';

export interface PaymentsConfig {
  tenantId: string;
  fraudDetectionEnabled: boolean;
  transactionProcessingEnabled: boolean;
  settlementEnabled: boolean;
  reconciliationEnabled: boolean;
}

export interface Transaction {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER' | 'REVERSAL';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  reference: string;
  description?: string;
  metadata?: any;
  createdAt: Date;
  processedAt?: Date;
}

export interface FraudDetectionResult {
  transactionId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  recommendations: string[];
  action: 'ALLOW' | 'REVIEW' | 'BLOCK' | 'FREEZE';
}

export interface SettlementResult {
  transactionId: string;
  settlementId: string;
  status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED';
  settlementDate: Date;
  amount: number;
  currency: string;
  fees?: number;
  reference?: string;
}

export interface ReconciliationResult {
  transactionId: string;
  status: 'MATCHED' | 'UNMATCHED' | 'PARTIAL_MATCH' | 'ERROR';
  differences?: string[];
  externalReference?: string;
  externalAmount?: number;
  externalStatus?: string;
  reconciledAt: Date;
}

export class PaymentsAgent implements AgentPackage {
  private config: PaymentsConfig;
  private name = 'Payments Agent';
  private version = '1.0.0';

  constructor(config: PaymentsConfig) {
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
        type: 'PAYMENTS',
        tenantId: this.config.tenantId,
        config: this.config,
        status: 'ACTIVE'
      }
    });
  }

  async execute(context: AgentExecutionContext): Promise<any> {
    const { task, data, metadata } = context;

    switch (task) {
      case 'PROCESS_TRANSACTION':
        return await this.processTransaction(data.transaction);
      
      case 'DETECT_FRAUD':
        return await this.detectFraud(data.transactionId);
      
      case 'SETTLE_PAYMENT':
        return await this.settlePayment(data.transactionId);
      
      case 'RECONCILE_TRANSACTIONS':
        return await this.reconcileTransactions(data.transactionIds || []);
      
      case 'GET_TRANSACTION_STATUS':
        return await this.getTransactionStatus(data.transactionId);
      
      case 'REVERSE_TRANSACTION':
        return await this.reverseTransaction(data.transactionId, data.reason);
      
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  private async processTransaction(transaction: Transaction): Promise<any> {
    console.log(`Processing transaction ${transaction.id}`);

    // Create transaction record
    const transactionRecord = await db.transaction.create({
      data: {
        id: transaction.id,
        fromAccount: transaction.fromAccount,
        toAccount: transaction.toAccount,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        status: 'PENDING',
        reference: transaction.reference,
        description: transaction.description,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
        tenantId: this.config.tenantId
      }
    });

    // Execute workflow steps
    const workflowSteps = [];

    if (this.config.fraudDetectionEnabled) {
      const fraudResult = await this.detectFraud(transaction.id);
      workflowSteps.push({
        step: 'FRAUD_DETECTION',
        result: fraudResult,
        timestamp: new Date()
      });

      // Handle fraud detection results
      if (fraudResult.action === 'BLOCK') {
        await this.updateTransactionStatus(transaction.id, 'FAILED');
        return {
          transactionId: transaction.id,
          status: 'FAILED',
          reason: 'Blocked by fraud detection',
          workflowSteps,
          processedAt: new Date()
        };
      } else if (fraudResult.action === 'REVIEW') {
        await this.updateTransactionStatus(transaction.id, 'PENDING');
        return {
          transactionId: transaction.id,
          status: 'PENDING_REVIEW',
          reason: 'Requires manual review',
          workflowSteps,
          processedAt: new Date()
        };
      }
    }

    if (this.config.transactionProcessingEnabled) {
      await this.updateTransactionStatus(transaction.id, 'PROCESSING');
      
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const processingResult = await this.completeTransaction(transaction.id);
      workflowSteps.push({
        step: 'TRANSACTION_PROCESSING',
        result: processingResult,
        timestamp: new Date()
      });
    }

    if (this.config.settlementEnabled) {
      const settlementResult = await this.settlePayment(transaction.id);
      workflowSteps.push({
        step: 'SETTLEMENT',
        result: settlementResult,
        timestamp: new Date()
      });
    }

    if (this.config.reconciliationEnabled) {
      const reconciliationResult = await this.reconcileTransactions([transaction.id]);
      workflowSteps.push({
        step: 'RECONCILIATION',
        result: reconciliationResult,
        timestamp: new Date()
      });
    }

    return {
      transactionId: transaction.id,
      status: 'COMPLETED',
      workflowSteps,
      processedAt: new Date()
    };
  }

  private async detectFraud(transactionId: string): Promise<FraudDetectionResult> {
    console.log(`Detecting fraud for transaction ${transactionId}`);

    // Get transaction data
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Calculate fraud risk factors
    const factors: string[] = [];
    let riskScore = 0;

    // Amount-based risk
    if (transaction.amount > 10000) {
      factors.push('High transaction amount');
      riskScore += 30;
    } else if (transaction.amount > 5000) {
      factors.push('Elevated transaction amount');
      riskScore += 15;
    }

    // Frequency-based risk (check recent transactions)
    const recentTransactions = await db.transaction.count({
      where: {
        fromAccount: transaction.fromAccount,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (recentTransactions > 10) {
      factors.push('High transaction frequency');
      riskScore += 25;
    } else if (recentTransactions > 5) {
      factors.push('Elevated transaction frequency');
      riskScore += 10;
    }

    // Geographic risk (if location data available)
    if (transaction.metadata?.location) {
      const location = transaction.metadata.location;
      if (location.country !== 'US') {
        factors.push('International transaction');
        riskScore += 20;
      }
      if (location.isHighRiskCountry) {
        factors.push('High-risk country');
        riskScore += 40;
      }
    }

    // Time-based risk
    const hour = new Date().getHours();
    if (hour >= 23 || hour <= 5) {
      factors.push('Unusual transaction time');
      riskScore += 15;
    }

    // Account behavior risk
    const accountAge = await this.getAccountAge(transaction.fromAccount);
    if (accountAge < 30) {
      factors.push('New account');
      riskScore += 25;
    }

    // Determine risk level and action
    let riskLevel: FraudDetectionResult['riskLevel'] = 'LOW';
    let action: FraudDetectionResult['action'] = 'ALLOW';

    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
      action = 'BLOCK';
    } else if (riskScore >= 60) {
      riskLevel = 'HIGH';
      action = 'REVIEW';
    } else if (riskScore >= 40) {
      riskLevel = 'MEDIUM';
      action = 'REVIEW';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (riskScore >= 40) {
      recommendations.push('Enhanced monitoring recommended');
      recommendations.push('Additional verification required');
    }

    if (transaction.amount > 10000) {
      recommendations.push('Consider implementing additional authentication');
    }

    const fraudResult: FraudDetectionResult = {
      transactionId,
      riskScore,
      riskLevel,
      factors,
      recommendations,
      action
    };

    // Store fraud detection result
    await db.fraudDetection.create({
      data: {
        transactionId,
        riskScore,
        riskLevel,
        factors,
        recommendations,
        action,
        tenantId: this.config.tenantId
      }
    });

    return fraudResult;
  }

  private async settlePayment(transactionId: string): Promise<SettlementResult> {
    console.log(`Settling payment for transaction ${transactionId}`);

    // Get transaction data
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Generate settlement ID
    const settlementId = `STL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate fees (simplified)
    const fees = transaction.amount * 0.0025; // 0.25% fee

    // Create settlement record
    const settlement = await db.settlement.create({
      data: {
        id: settlementId,
        transactionId,
        status: 'PENDING',
        settlementDate: new Date(),
        amount: transaction.amount,
        currency: transaction.currency,
        fees,
        reference: `SETTLE-${transaction.reference}`,
        tenantId: this.config.tenantId
      }
    });

    // Simulate settlement processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update settlement status
    await db.settlement.update({
      where: { id: settlementId },
      data: {
        status: 'SETTLED'
      }
    });

    const settlementResult: SettlementResult = {
      transactionId,
      settlementId,
      status: 'SETTLED',
      settlementDate: new Date(),
      amount: transaction.amount,
      currency: transaction.currency,
      fees,
      reference: `SETTLE-${transaction.reference}`
    };

    return settlementResult;
  }

  private async reconcileTransactions(transactionIds: string[]): Promise<ReconciliationResult[]> {
    console.log(`Reconciling transactions: ${transactionIds.join(', ')}`);

    const results: ReconciliationResult[] = [];

    for (const transactionId of transactionIds) {
      // Get transaction data
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        results.push({
          transactionId,
          status: 'ERROR',
          differences: ['Transaction not found'],
          reconciledAt: new Date()
        });
        continue;
      }

      // Simulate external system reconciliation
      const externalData = await this.getExternalTransactionData(transactionId);
      
      let status: ReconciliationResult['status'] = 'MATCHED';
      const differences: string[] = [];

      // Compare amounts
      if (transaction.amount !== externalData.amount) {
        differences.push(`Amount mismatch: internal ${transaction.amount} vs external ${externalData.amount}`);
        status = 'UNMATCHED';
      }

      // Compare status
      if (transaction.status !== externalData.status) {
        differences.push(`Status mismatch: internal ${transaction.status} vs external ${externalData.status}`);
        status = 'PARTIAL_MATCH';
      }

      // Create reconciliation record
      const reconciliation = await db.reconciliation.create({
        data: {
          transactionId,
          status,
          differences: differences.length > 0 ? differences : undefined,
          externalReference: externalData.reference,
          externalAmount: externalData.amount,
          externalStatus: externalData.status,
          reconciledAt: new Date(),
          tenantId: this.config.tenantId
        }
      });

      results.push({
        transactionId,
        status,
        differences: differences.length > 0 ? differences : undefined,
        externalReference: externalData.reference,
        externalAmount: externalData.amount,
        externalStatus: externalData.status,
        reconciledAt: new Date()
      });
    }

    return results;
  }

  private async getTransactionStatus(transactionId: string): Promise<any> {
    console.log(`Getting status for transaction ${transactionId}`);

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fraudDetection: true,
        settlement: true,
        reconciliation: true
      }
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    return {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.type,
      createdAt: transaction.createdAt,
      processedAt: transaction.processedAt,
      fraudDetection: transaction.fraudDetection,
      settlement: transaction.settlement,
      reconciliation: transaction.reconciliation
    };
  }

  private async reverseTransaction(transactionId: string, reason: string): Promise<any> {
    console.log(`Reversing transaction ${transactionId}`);

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== 'COMPLETED') {
      throw new Error(`Cannot reverse transaction with status ${transaction.status}`);
    }

    // Create reversal transaction
    const reversalId = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const reversalTransaction = await db.transaction.create({
      data: {
        id: reversalId,
        fromAccount: transaction.toAccount,
        toAccount: transaction.fromAccount,
        amount: transaction.amount,
        currency: transaction.currency,
        type: 'REVERSAL',
        status: 'PENDING',
        reference: `REV-${transaction.reference}`,
        description: `Reversal for ${transaction.reference}: ${reason}`,
        metadata: {
          originalTransactionId: transactionId,
          reversalReason: reason
        },
        createdAt: new Date(),
        tenantId: this.config.tenantId
      }
    });

    // Process the reversal
    await this.updateTransactionStatus(transactionId, 'REVERSED');
    await this.updateTransactionStatus(reversalId, 'COMPLETED');

    return {
      originalTransactionId: transactionId,
      reversalTransactionId: reversalId,
      status: 'REVERSED',
      reason,
      reversedAt: new Date()
    };
  }

  // Helper methods
  private async updateTransactionStatus(transactionId: string, status: string): Promise<void> {
    await db.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        processedAt: status === 'COMPLETED' ? new Date() : undefined
      }
    });
  }

  private async completeTransaction(transactionId: string): Promise<any> {
    await this.updateTransactionStatus(transactionId, 'COMPLETED');
    return { transactionId, status: 'COMPLETED', completedAt: new Date() };
  }

  private async getAccountAge(accountId: string): Promise<number> {
    // Simulate getting account age in days
    // In a real implementation, this would query the account system
    return Math.floor(Math.random() * 365); // Random age between 0-365 days
  }

  private async getExternalTransactionData(transactionId: string): Promise<any> {
    // Simulate getting transaction data from external system
    // In a real implementation, this would call external APIs
    return {
      reference: `EXT-${transactionId}`,
      amount: Math.floor(Math.random() * 10000) + 1000,
      status: 'COMPLETED'
    };
  }
}