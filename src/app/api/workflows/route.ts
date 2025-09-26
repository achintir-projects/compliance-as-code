import { NextRequest, NextResponse } from 'next/server';
import { WorkflowOrchestrator } from '@/lib/orchestration/WorkflowOrchestrator';

const workflowOrchestrator = new WorkflowOrchestrator();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const workflowId = searchParams.get('workflowId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const filters: any = {
      limit,
      offset
    };

    if (status) {
      filters.status = status;
    }

    if (workflowId) {
      filters.workflowId = workflowId;
    }

    const executions = await workflowOrchestrator.listWorkflowExecutions(tenantId, filters);

    return NextResponse.json({
      success: true,
      executions,
      total: executions.length,
      filters
    });

  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow executions' },
      { status: 500 }
    );
  }
}