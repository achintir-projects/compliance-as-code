import { db } from '@/lib/db';
import { agentWorkflowIntegration } from '@/lib/integration/AgentWorkflowIntegration';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  metadata?: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: string;
  agentId?: string;
  task: any;
  timeout?: number;
  retries?: number;
  dependencies?: string[];
  onFailure?: 'STOP' | 'CONTINUE' | 'ROLLBACK';
}

export interface WorkflowResult {
  workflowId: string;
  executionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  steps: StepResult[];
  finalResult?: any;
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata?: any;
}

export interface StepResult {
  stepId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
  retryCount: number;
  resourceUsage?: any;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  tenantId: string;
  userId?: string;
  input: any;
  sharedData: Map<string, any>;
  stepResults: Map<string, StepResult>;
}

export class WorkflowOrchestrator {
  private opaClient: OPAClient;
  private temporalClient: TemporalClient;
  private complianceChecker: ComplianceChecker;

  constructor() {
    this.opaClient = new OPAClient();
    this.temporalClient = new TemporalClient();
    this.complianceChecker = new ComplianceChecker();
    
    // Initialize agent packages
    this.initializeAgentPackages();
  }

  private async initializeAgentPackages(): Promise<void> {
    try {
      await agentWorkflowIntegration.initializeAgentPackages('tenant-1');
      console.log('Agent packages initialized successfully');
    } catch (error) {
      console.error('Failed to initialize agent packages:', error);
    }
  }

  async executeWorkflow(
    workflow: WorkflowDefinition,
    context: Partial<WorkflowContext> = {}
  ): Promise<WorkflowResult> {
    const executionId = this.generateExecutionId();
    const fullContext: WorkflowContext = {
      workflowId: workflow.id,
      executionId,
      tenantId: context.tenantId || 'tenant-1',
      userId: context.userId,
      input: context.input || {},
      sharedData: new Map(),
      stepResults: new Map()
    };

    try {
      // Check compliance policies
      const complianceCheck = await this.opaClient.evaluate(
        'aura.workflow.compliance',
        {
          workflow,
          context: fullContext,
          user: { id: context.userId, tenantId: context.tenantId }
        }
      );

      if (!complianceCheck.allow) {
        throw new ComplianceError(complianceCheck.reason);
      }

      // Create workflow execution record
      await this.createWorkflowExecution(workflow, fullContext);

      // Start Temporal workflow
      const workflowHandle = await this.temporalClient.startWorkflow({
        taskQueue: 'aura-agent-workflows',
        workflowType: 'AgentWorkflow',
        args: [workflow, fullContext]
      });

      // Monitor and return result
      return await this.monitorWorkflow(workflowHandle, workflow, fullContext);

    } catch (error) {
      await this.handleWorkflowError(workflow, fullContext, error);
      throw error;
    }
  }

  private async createWorkflowExecution(
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<void> {
    try {
      await prisma.workflowExecution.create({
        data: {
          id: context.executionId,
          workflowId: workflow.id,
          status: 'PENDING',
          input: {
            definition: workflow,
            context: {
              tenantId: context.tenantId,
              userId: context.userId,
              input: context.input
            }
          },
          tenantId: context.tenantId
        }
      });
    } catch (error) {
      console.error('Failed to create workflow execution record:', error);
    }
  }

  private async monitorWorkflow(
    workflowHandle: any,
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    return new Promise((resolve, reject) => {
      const startTime = new Date();
      let stepResults: StepResult[] = [];

      workflowHandle.on('started', () => {
        this.updateWorkflowStatus(context.executionId, 'RUNNING');
      });

      workflowHandle.on('stepCompleted', (stepResult: StepResult) => {
        stepResults.push(stepResult);
        this.recordStepResult(context.executionId, stepResult);
      });

      workflowHandle.on('completed', (finalResult: any) => {
        const endTime = new Date();
        const result: WorkflowResult = {
          workflowId: workflow.id,
          executionId: context.executionId,
          status: 'COMPLETED',
          steps: stepResults,
          finalResult,
          startTime,
          endTime,
          metadata: {
            duration: endTime.getTime() - startTime.getTime(),
            stepCount: stepResults.length,
            successfulSteps: stepResults.filter(s => s.status === 'COMPLETED').length
          }
        };

        this.updateWorkflowStatus(context.executionId, 'COMPLETED', {
          output: finalResult,
          endTime,
          metadata: result.metadata
        });

        resolve(result);
      });

      workflowHandle.on('failed', (error: Error) => {
        const endTime = new Date();
        const result: WorkflowResult = {
          workflowId: workflow.id,
          executionId: context.executionId,
          status: 'FAILED',
          steps: stepResults,
          startTime,
          endTime,
          error: error.message,
          metadata: {
            duration: endTime.getTime() - startTime.getTime(),
            stepCount: stepResults.length,
            failedSteps: stepResults.filter(s => s.status === 'FAILED').length
          }
        };

        this.updateWorkflowStatus(context.executionId, 'FAILED', {
          error: error.message,
          endTime,
          metadata: result.metadata
        });

        reject(error);
      });

      workflowHandle.on('progress', (progress: any) => {
        // Update progress monitoring
        this.updateWorkflowProgress(context.executionId, progress);
      });
    });
  }

  private async updateWorkflowStatus(
    executionId: string,
    status: string,
    data?: any
  ): Promise<void> {
    try {
      const updateData: any = { status };
      if (data) {
        Object.assign(updateData, data);
      }

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: updateData
      });
    } catch (error) {
      console.error('Failed to update workflow status:', error);
    }
  }

  private async recordStepResult(
    executionId: string,
    stepResult: StepResult
  ): Promise<void> {
    try {
      await prisma.workflowStep.create({
        data: {
          executionId,
          stepNumber: stepResult.stepId ? parseInt(stepResult.stepId.split('-')[1]) : 0,
          agentId: stepResult.agentId || 'unknown',
          input: stepResult,
          output: stepResult.output,
          status: stepResult.status,
          startedAt: stepResult.startTime,
          completedAt: stepResult.endTime,
          error: stepResult.error
        }
      });
    } catch (error) {
      console.error('Failed to record step result:', error);
    }
  }

  private async updateWorkflowProgress(
    executionId: string,
    progress: any
  ): Promise<void> {
    // Update workflow progress in monitoring system
    console.log(`Workflow ${executionId} progress:`, progress);
  }

  private async handleWorkflowError(
    workflow: WorkflowDefinition,
    context: WorkflowContext,
    error: any
  ): Promise<void> {
    console.error('Workflow execution error:', error);
    
    await this.updateWorkflowStatus(context.executionId, 'FAILED', {
      error: error.message,
      endTime: new Date()
    });

    // Implement rollback logic if needed
    if (this.requiresRollback(workflow)) {
      await this.rollbackWorkflow(workflow, context);
    }
  }

  private requiresRollback(workflow: WorkflowDefinition): boolean {
    return workflow.steps.some(step => step.onFailure === 'ROLLBACK');
  }

  private async rollbackWorkflow(
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<void> {
    console.log(`Initiating rollback for workflow ${workflow.id}`);
    
    // Implement rollback logic
    // This would execute compensating actions for completed steps
  }

  private generateExecutionId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Agent task execution method
  async executeAgentTask(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<StepResult> {
    const startTime = new Date();
    const stepResult: StepResult = {
      stepId: step.id,
      status: 'RUNNING',
      startTime,
      retryCount: 0
    };

    try {
      // Validate the step
      const validation = agentWorkflowIntegration.validateWorkflowStep(step);
      if (!validation.valid) {
        throw new Error(`Invalid workflow step: ${validation.errors.join(', ')}`);
      }

      // Execute the agent task
      const result = await agentWorkflowIntegration.executeAgentTask(
        step.task.action,
        step.task,
        {
          tenantId: context.tenantId,
          userId: context.userId,
          executionId: context.executionId,
          workflowId: context.workflowId
        }
      );

      if (result.success) {
        stepResult.status = 'COMPLETED';
        stepResult.output = result.result;
      } else {
        stepResult.status = 'FAILED';
        stepResult.error = result.error;
      }

    } catch (error) {
      stepResult.status = 'FAILED';
      stepResult.error = error instanceof Error ? error.message : 'Unknown error';
    }

    stepResult.endTime = new Date();
    return stepResult;
  }

  // Workflow management methods
  async getWorkflowExecution(executionId: string): Promise<WorkflowResult | null> {
    try {
      const execution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
        include: {
          steps: true
        }
      });

      if (!execution) {
        return null;
      }

      const stepResults: StepResult[] = execution.steps.map(step => ({
        stepId: `step-${step.stepNumber}`,
        status: step.status,
        startTime: step.startedAt,
        endTime: step.completedAt,
        output: step.output,
        error: step.error,
        retryCount: 0,
        resourceUsage: undefined
      }));

      return {
        workflowId: execution.workflowId,
        executionId: execution.id,
        status: execution.status,
        steps: stepResults,
        finalResult: execution.output,
        startTime: execution.startedAt,
        endTime: execution.completedAt || undefined,
        error: execution.error || undefined,
        metadata: execution.metadata
      };
    } catch (error) {
      console.error('Failed to get workflow execution:', error);
      return null;
    }
  }

  async cancelWorkflow(executionId: string, reason?: string): Promise<boolean> {
    try {
      // Cancel Temporal workflow
      await this.temporalClient.cancelWorkflow(executionId);
      
      // Update status
      await this.updateWorkflowStatus(executionId, 'CANCELLED', {
        error: reason || 'Cancelled by user',
        endTime: new Date()
      });

      return true;
    } catch (error) {
      console.error('Failed to cancel workflow:', error);
      return false;
    }
  }

  async listWorkflowExecutions(
    tenantId: string,
    filters?: {
      status?: string;
      workflowId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowResult[]> {
    try {
      const executions = await prisma.workflowExecution.findMany({
        where: {
          tenantId,
          ...(filters?.status && { status: filters.status }),
          ...(filters?.workflowId && { workflowId: filters.workflowId })
        },
        include: {
          steps: true
        },
        orderBy: { startedAt: 'desc' },
        limit: filters?.limit || 50,
        offset: filters?.offset || 0
      });

      return executions.map(execution => ({
        workflowId: execution.workflowId,
        executionId: execution.id,
        status: execution.status,
        steps: execution.steps.map(step => ({
          stepId: `step-${step.stepNumber}`,
          status: step.status,
          startTime: step.startedAt,
          endTime: step.completedAt,
          output: step.output,
          error: step.error,
          retryCount: 0,
          resourceUsage: undefined
        })),
        finalResult: execution.output,
        startTime: execution.startedAt,
        endTime: execution.completedAt || undefined,
        error: execution.error || undefined,
        metadata: execution.metadata
      }));
    } catch (error) {
      console.error('Failed to list workflow executions:', error);
      return [];
    }
  }
}

// Mock implementations for external services
class OPAClient {
  async evaluate(policy: string, input: any): Promise<{ allow: boolean; reason?: string }> {
    // Mock OPA evaluation
    console.log(`Evaluating policy ${policy} with input:`, input);
    
    // Simulate policy evaluation
    return {
      allow: true,
      reason: 'Policy evaluation passed'
    };
  }
}

class TemporalClient {
  async startWorkflow(config: any): Promise<any> {
    // Mock Temporal workflow start
    console.log('Starting Temporal workflow:', config);
    
    // Return mock workflow handle
    return {
      on: (event: string, callback: (...args: any[]) => void) => {
        // Mock event handling
        if (event === 'started') {
          setTimeout(() => callback(), 100);
        } else if (event === 'completed') {
          setTimeout(() => callback({ result: 'Workflow completed successfully' }), 2000);
        }
      }
    };
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    console.log(`Cancelling workflow ${executionId}`);
  }
}

class ComplianceChecker {
  async checkWorkflowCompliance(workflow: WorkflowDefinition): Promise<{ compliant: boolean; issues: string[] }> {
    // Mock compliance checking
    console.log('Checking workflow compliance:', workflow.id);
    
    return {
      compliant: true,
      issues: []
    };
  }
}

class ComplianceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComplianceError';
  }
}