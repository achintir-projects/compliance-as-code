import { agentPackageManager } from '@/lib/agent-packages/agent-package-framework';
import { AgentExecutionContext } from '@/lib/agent-packages/agent-package-framework';
import { CommercialBankingAgent } from '@/lib/agent-packages/commercial-banking';
import { PaymentsAgent } from '@/lib/agent-packages/payments';
import { InsuranceAgent } from '@/lib/agent-packages/insurance';
import { WealthManagementAgent } from '@/lib/agent-packages/wealth-management';
import { RegulatoryComplianceAgent } from '@/lib/agent-packages/regulatory-compliance';

export interface AgentPackageIntegration {
  packageName: string;
  version: string;
  agentType: string;
  capabilities: string[];
  workflowTasks: string[];
}

export class AgentWorkflowIntegration {
  private registeredPackages: Map<string, AgentPackageIntegration> = new Map();
  private packageTaskMapping: Map<string, string> = new Map(); // task -> packageName

  constructor() {
    this.initializePackageIntegrations();
  }

  private initializePackageIntegrations(): void {
    // Register Commercial Banking Agent
    this.registerPackageIntegration({
      packageName: 'Commercial Banking Agent',
      version: '1.0.0',
      agentType: 'COMMERCIAL_BANKING',
      capabilities: ['LOAN_PROCESSING', 'RISK_ASSESSMENT', 'COMPLIANCE_CHECKING', 'CREDIT_SCORING'],
      workflowTasks: [
        'PROCESS_LOAN_APPLICATION',
        'ASSESS_RISK',
        'PERFORM_COMPLIANCE_CHECK',
        'MAKE_CREDIT_DECISION',
        'GENERATE_LOAN_DOCUMENTS'
      ]
    });

    // Register Payments Agent
    this.registerPackageIntegration({
      packageName: 'Payments Agent',
      version: '1.0.0',
      agentType: 'PAYMENTS',
      capabilities: ['TRANSACTION_PROCESSING', 'FRAUD_DETECTION', 'SETTLEMENT', 'RECONCILIATION'],
      workflowTasks: [
        'PROCESS_TRANSACTION',
        'DETECT_FRAUD',
        'SETTLE_PAYMENT',
        'RECONCILE_TRANSACTIONS',
        'REVERSE_TRANSACTION',
        'GET_TRANSACTION_STATUS'
      ]
    });

    // Register Insurance Agent
    this.registerPackageIntegration({
      packageName: 'Insurance Agent',
      version: '1.0.0',
      agentType: 'INSURANCE',
      capabilities: ['UNDERWRITING', 'CLAIMS_PROCESSING', 'RISK_MODELING', 'POLICY_MANAGEMENT'],
      workflowTasks: [
        'UNDERWRITE_POLICY',
        'PROCESS_CLAIM',
        'ASSESS_RISK',
        'MANAGE_POLICY',
        'GENERATE_QUOTE',
        'ANALYZE_CLAIM_TRENDS'
      ]
    });

    // Register Wealth Management Agent
    this.registerPackageIntegration({
      packageName: 'Wealth Management Agent',
      version: '1.0.0',
      agentType: 'WEALTH_MANAGEMENT',
      capabilities: ['PORTFOLIO_OPTIMIZATION', 'FINANCIAL_PLANNING', 'MARKET_ANALYSIS', 'RISK_MANAGEMENT'],
      workflowTasks: [
        'OPTIMIZE_PORTFOLIO',
        'CREATE_FINANCIAL_PLAN',
        'ANALYZE_MARKET',
        'MANAGE_RISK',
        'GENERATE_REPORT',
        'REBALANCE_PORTFOLIO',
        'TAX_OPTIMIZATION'
      ]
    });

    // Register Regulatory Compliance Agent
    this.registerPackageIntegration({
      packageName: 'Regulatory Compliance Agent',
      version: '1.0.0',
      agentType: 'REGULATORY_COMPLIANCE',
      capabilities: ['AML', 'KYC', 'REGULATORY_REPORTING', 'COMPLIANCE_MONITORING'],
      workflowTasks: [
        'PERFORM_AML_CHECK',
        'PERFORM_KYC_CHECK',
        'GENERATE_REGULATORY_REPORT',
        'MONITOR_COMPLIANCE',
        'ASSESS_COMPLIANCE_RISK',
        'MANAGE_VIOLATIONS',
        'AUDIT_COMPLIANCE'
      ]
    });
  }

  private registerPackageIntegration(integration: AgentPackageIntegration): void {
    const packageKey = `${integration.packageName}@${integration.version}`;
    this.registeredPackages.set(packageKey, integration);

    // Map tasks to package names
    integration.workflowTasks.forEach(task => {
      this.packageTaskMapping.set(task, integration.packageName);
    });

    console.log(`Registered agent package integration: ${packageKey}`);
  }

  async executeAgentTask(
    task: string,
    data: any,
    context: {
      tenantId: string;
      userId?: string;
      executionId: string;
      workflowId: string;
    }
  ): Promise<any> {
    const packageName = this.packageTaskMapping.get(task);
    
    if (!packageName) {
      throw new Error(`No agent package found for task: ${task}`);
    }

    // Find the package version
    const packageIntegration = Array.from(this.registeredPackages.values())
      .find(p => p.packageName === packageName);

    if (!packageIntegration) {
      throw new Error(`Agent package integration not found: ${packageName}`);
    }

    // Create execution context
    const executionContext: AgentExecutionContext = {
      task,
      data,
      metadata: {
        workflowId: context.workflowId,
        executionId: context.executionId,
        userId: context.userId
      },
      tenantId: context.tenantId
    };

    // Execute the task using the agent package
    try {
      const result = await agentPackageManager.executePackage(
        packageName,
        packageIntegration.version,
        executionContext
      );

      return {
        success: true,
        result,
        packageName,
        task,
        executedAt: new Date()
      };
    } catch (error) {
      console.error(`Agent task execution failed for ${task}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        packageName,
        task,
        executedAt: new Date()
      };
    }
  }

  getAvailablePackages(): AgentPackageIntegration[] {
    return Array.from(this.registeredPackages.values());
  }

  getPackageForTask(task: string): AgentPackageIntegration | null {
    const packageName = this.packageTaskMapping.get(task);
    if (!packageName) return null;

    return Array.from(this.registeredPackages.values())
      .find(p => p.packageName === packageName) || null;
  }

  getTasksForPackage(packageName: string): string[] {
    const integration = Array.from(this.registeredPackages.values())
      .find(p => p.packageName === packageName);
    
    return integration?.workflowTasks || [];
  }

  validateWorkflowStep(step: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if agent type is supported
    const integration = Array.from(this.registeredPackages.values())
      .find(p => p.agentType === step.agentType);

    if (!integration) {
      errors.push(`Unsupported agent type: ${step.agentType}`);
      return { valid: false, errors };
    }

    // Check if task is supported by the agent
    if (!integration.workflowTasks.includes(step.task?.action)) {
      errors.push(`Task '${step.task?.action}' not supported by agent ${step.agentType}`);
    }

    return { valid: errors.length === 0, errors };
  }

  async initializeAgentPackages(tenantId: string): Promise<void> {
    console.log(`Initializing agent packages for tenant: ${tenantId}`);

    const packages = [
      { name: 'Commercial Banking Agent', config: { tenantId } },
      { name: 'Payments Agent', config: { tenantId } },
      { name: 'Insurance Agent', config: { tenantId } },
      { name: 'Wealth Management Agent', config: { tenantId } },
      { name: 'Regulatory Compliance Agent', config: { tenantId } }
    ];

    for (const pkg of packages) {
      try {
        await this.registerAgentPackage(pkg.name, pkg.config);
      } catch (error) {
        console.error(`Failed to register agent package ${pkg.name}:`, error);
      }
    }
  }

  private async registerAgentPackage(packageName: string, config: any): Promise<void> {
    const response = await fetch('/api/agent-packages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageName,
        tenantId: config.tenantId,
        config
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register agent package: ${packageName}`);
    }

    const result = await response.json();
    console.log(`Agent package registered: ${result.message}`);
  }

  // Workflow template generation
  generateWorkflowTemplate(workflowType: string): any {
    const templates = {
      'CUSTOMER_ONBOARDING': {
        id: 'customer-onboarding',
        name: 'Customer Onboarding',
        description: 'Complete customer onboarding with KYC, AML, and risk assessment',
        steps: [
          {
            id: 'step-1',
            name: 'KYC Verification',
            agentType: 'REGULATORY_COMPLIANCE',
            task: { action: 'PERFORM_KYC_CHECK' },
            timeout: 300,
            retries: 3,
            onFailure: 'STOP'
          },
          {
            id: 'step-2',
            name: 'AML Screening',
            agentType: 'REGULATORY_COMPLIANCE',
            task: { action: 'PERFORM_AML_CHECK' },
            timeout: 300,
            retries: 3,
            onFailure: 'STOP',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Risk Assessment',
            agentType: 'COMMERCIAL_BANKING',
            task: { action: 'ASSESS_RISK' },
            timeout: 600,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-1', 'step-2']
          }
        ]
      },
      'LOAN_PROCESSING': {
        id: 'loan-processing',
        name: 'Loan Processing',
        description: 'End-to-end loan processing workflow',
        steps: [
          {
            id: 'step-1',
            name: 'Loan Application',
            agentType: 'COMMERCIAL_BANKING',
            task: { action: 'PROCESS_LOAN_APPLICATION' },
            timeout: 600,
            retries: 3,
            onFailure: 'STOP'
          },
          {
            id: 'step-2',
            name: 'Credit Decision',
            agentType: 'COMMERCIAL_BANKING',
            task: { action: 'MAKE_CREDIT_DECISION' },
            timeout: 300,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Document Generation',
            agentType: 'COMMERCIAL_BANKING',
            task: { action: 'GENERATE_LOAN_DOCUMENTS' },
            timeout: 300,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-2']
          }
        ]
      },
      'PAYMENT_PROCESSING': {
        id: 'payment-processing',
        name: 'Payment Processing',
        description: 'Secure payment processing with fraud detection',
        steps: [
          {
            id: 'step-1',
            name: 'Transaction Processing',
            agentType: 'PAYMENTS',
            task: { action: 'PROCESS_TRANSACTION' },
            timeout: 300,
            retries: 3,
            onFailure: 'STOP'
          },
          {
            id: 'step-2',
            name: 'Fraud Detection',
            agentType: 'PAYMENTS',
            task: { action: 'DETECT_FRAUD' },
            timeout: 200,
            retries: 2,
            onFailure: 'REVIEW',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Payment Settlement',
            agentType: 'PAYMENTS',
            task: { action: 'SETTLE_PAYMENT' },
            timeout: 600,
            retries: 3,
            onFailure: 'CONTINUE',
            dependencies: ['step-1', 'step-2']
          }
        ]
      },
      'INSURANCE_CLAIM': {
        id: 'insurance-claim',
        name: 'Insurance Claim Processing',
        description: 'Complete insurance claim processing workflow',
        steps: [
          {
            id: 'step-1',
            name: 'Claim Submission',
            agentType: 'INSURANCE',
            task: { action: 'PROCESS_CLAIM' },
            timeout: 300,
            retries: 3,
            onFailure: 'STOP'
          },
          {
            id: 'step-2',
            name: 'Claim Assessment',
            agentType: 'INSURANCE',
            task: { action: 'ASSESS_RISK' },
            timeout: 600,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Claim Decision',
            agentType: 'INSURANCE',
            task: { action: 'MANAGE_POLICY' },
            timeout: 300,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-2']
          }
        ]
      },
      'WEALTH_MANAGEMENT': {
        id: 'wealth-management',
        name: 'Wealth Management Review',
        description: 'Comprehensive wealth management review',
        steps: [
          {
            id: 'step-1',
            name: 'Portfolio Analysis',
            agentType: 'WEALTH_MANAGEMENT',
            task: { action: 'ANALYZE_MARKET' },
            timeout: 600,
            retries: 2,
            onFailure: 'CONTINUE'
          },
          {
            id: 'step-2',
            name: 'Portfolio Optimization',
            agentType: 'WEALTH_MANAGEMENT',
            task: { action: 'OPTIMIZE_PORTFOLIO' },
            timeout: 900,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Financial Planning',
            agentType: 'WEALTH_MANAGEMENT',
            task: { action: 'CREATE_FINANCIAL_PLAN' },
            timeout: 600,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-1']
          }
        ]
      },
      'COMPLIANCE_AUDIT': {
        id: 'compliance-audit',
        name: 'Compliance Audit',
        description: 'Comprehensive compliance audit workflow',
        steps: [
          {
            id: 'step-1',
            name: 'Compliance Assessment',
            agentType: 'REGULATORY_COMPLIANCE',
            task: { action: 'ASSESS_COMPLIANCE_RISK' },
            timeout: 600,
            retries: 2,
            onFailure: 'CONTINUE'
          },
          {
            id: 'step-2',
            name: 'Regulatory Reporting',
            agentType: 'REGULATORY_COMPLIANCE',
            task: { action: 'GENERATE_REGULATORY_REPORT' },
            timeout: 900,
            retries: 2,
            onFailure: 'CONTINUE',
            dependencies: ['step-1']
          },
          {
            id: 'step-3',
            name: 'Compliance Audit',
            agentType: 'REGULATORY_COMPLIANCE',
            task: { action: 'AUDIT_COMPLIANCE' },
            timeout: 1200,
            retries: 1,
            onFailure: 'CONTINUE',
            dependencies: ['step-1', 'step-2']
          }
        ]
      }
    };

    return templates[workflowType as keyof typeof templates] || null;
  }

  getAvailableWorkflowTemplates(): string[] {
    return [
      'CUSTOMER_ONBOARDING',
      'LOAN_PROCESSING',
      'PAYMENT_PROCESSING',
      'INSURANCE_CLAIM',
      'WEALTH_MANAGEMENT',
      'COMPLIANCE_AUDIT'
    ];
  }
}

// Global instance
export const agentWorkflowIntegration = new AgentWorkflowIntegration();