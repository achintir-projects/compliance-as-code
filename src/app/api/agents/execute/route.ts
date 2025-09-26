import { NextRequest, NextResponse } from 'next/server';
import { AgentRuntime, AgentConfig, AgentTask, ExecutionOptions } from '@/lib/runtime/AgentRuntime';

const agentRuntime = new AgentRuntime();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentConfig, task, options } = body;

    // Validate required fields
    if (!agentConfig || !task) {
      return NextResponse.json(
        { error: 'Agent configuration and task are required' },
        { status: 400 }
      );
    }

    // Validate agent config
    if (!agentConfig.id || !agentConfig.name || !agentConfig.type || !agentConfig.tenantId) {
      return NextResponse.json(
        { error: 'Invalid agent configuration' },
        { status: 400 }
      );
    }

    // Validate task
    if (!task.id || !task.action || !task.resource) {
      return NextResponse.json(
        { error: 'Invalid task configuration' },
        { status: 400 }
      );
    }

    // Set default quotas if not provided
    const defaultQuotas = {
      memory: 512, // MB
      cpu: 1, // core
      executionTime: 300 // seconds
    };

    const fullAgentConfig: AgentConfig = {
      ...agentConfig,
      quotas: agentConfig.quotas || defaultQuotas,
      capabilities: agentConfig.capabilities || [],
      runtimeType: agentConfig.runtimeType || 'WASM'
    };

    const fullTask: AgentTask = {
      ...task,
      data: task.data || {},
      metadata: task.metadata || {}
    };

    const fullOptions: ExecutionOptions = {
      timeout: options?.timeout,
      enableMonitoring: options?.enableMonitoring ?? true,
      enableProfiling: options?.enableProfiling ?? false
    };

    // Execute agent
    const result = await agentRuntime.executeAgent(fullAgentConfig, fullTask, fullOptions);

    return NextResponse.json({
      success: true,
      result: {
        taskId: result.taskId,
        output: result.output,
        resourceUsage: result.resourceUsage,
        confidence: result.confidence,
        explainability: result.explainability
      }
    });

  } catch (error) {
    console.error('Agent execution error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        return NextResponse.json(
          { error: 'Agent quota exceeded', details: error.message },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Agent execution failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown error occurred during agent execution' },
      { status: 500 }
    );
  }
}