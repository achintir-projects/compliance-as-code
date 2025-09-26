import { NextRequest, NextResponse } from 'next/server';
import { agentWorkflowIntegration } from '@/lib/integration/AgentWorkflowIntegration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateType, tenantId } = body;

    if (!templateType || !tenantId) {
      return NextResponse.json(
        { error: 'Template type and tenant ID are required' },
        { status: 400 }
      );
    }

    // Get workflow template from integration
    const template = agentWorkflowIntegration.generateWorkflowTemplate(templateType);

    if (!template) {
      return NextResponse.json(
        { error: `Template not found: ${templateType}` },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error loading workflow template:', error);
    return NextResponse.json(
      { error: 'Failed to load workflow template' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const templates = agentWorkflowIntegration.getAvailableWorkflowTemplates();
    
    return NextResponse.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error getting workflow templates:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow templates' },
      { status: 500 }
    );
  }
}