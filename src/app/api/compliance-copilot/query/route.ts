import { NextRequest, NextResponse } from 'next/server';
import { ContextAwareComplianceCopilot } from '@/lib/compliance-copilot/ContextAwareComplianceCopilot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, regulation, jurisdiction, timeFrame, context, userId } = body;

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    const copilot = new ContextAwareComplianceCopilot();
    await copilot.initialize();

    const complianceQuery = {
      id: `query-${Date.now()}`,
      query,
      regulation,
      jurisdiction,
      timeFrame,
      context,
      userId,
      timestamp: new Date()
    };

    const response = await copilot.processQuery(complianceQuery);

    return NextResponse.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('Error processing compliance query:', error);
    return NextResponse.json(
      { error: 'Failed to process compliance query' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      message: 'Context-Aware Compliance Copilot is ready',
      capabilities: [
        'Natural language compliance queries',
        'Regulation-specific responses',
        'Jurisdiction-aware analysis',
        'Time-frame contextualization',
        'DSL generation from natural language',
        'Interactive visualizations',
        'Voice response generation'
      ]
    });
  } catch (error) {
    console.error('Error fetching copilot status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch copilot status' },
      { status: 500 }
    );
  }
}