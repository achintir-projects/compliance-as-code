import { NextRequest, NextResponse } from 'next/server';
import { WorkflowOrchestrator, WorkflowDefinition, WorkflowContext } from '@/lib/orchestration/WorkflowOrchestrator';

const workflowOrchestrator = new WorkflowOrchestrator();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, context } = body;

    // Validate required fields
    if (!workflow || !workflow.id || !workflow.name || !workflow.steps) {
      return NextResponse.json(
        { error: 'Invalid workflow definition' },
        { status: 400 }
      );
    }

    // Validate workflow steps
    if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
      return NextResponse.json(
        { error: 'Workflow must have at least one step' },
        { status: 400 }
      );
    }

    // Validate each step
    for (const step of workflow.steps) {
      if (!step.id || !step.name || !step.agentType) {
        return NextResponse.json(
          { error: 'Each step must have id, name, and agentType' },
          { status: 400 }
        );
      }
    }

    // Set default context if not provided
    const defaultContext: Partial<WorkflowContext> = {
      tenantId: context?.tenantId || 'tenant-1',
      userId: context?.userId,
      input: context?.input || {}
    };

    // Execute workflow
    const result = await workflowOrchestrator.executeWorkflow(workflow, defaultContext);

    return NextResponse.json({
      success: true,
      result: {
        workflowId: result.workflowId,
        executionId: result.executionId,
        status: result.status,
        startTime: result.startTime,
        steps: result.steps,
        finalResult: result.finalResult,
        metadata: result.metadata
      }
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'ComplianceError') {
        return NextResponse.json(
          { error: 'Workflow compliance check failed', details: error.message },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Workflow execution failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown error occurred during workflow execution' },
      { status: 500 }
    );
  }
}