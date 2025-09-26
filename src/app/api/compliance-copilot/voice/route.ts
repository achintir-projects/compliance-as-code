import { NextRequest, NextResponse } from 'next/server';
import { ContextAwareComplianceCopilot } from '@/lib/compliance-copilot/ContextAwareComplianceCopilot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, userId } = body;

    if (!query || !userId) {
      return NextResponse.json(
        { error: 'Query and userId are required' },
        { status: 400 }
      );
    }

    const copilot = new ContextAwareComplianceCopilot();
    await copilot.initialize();

    const voiceResponse = await copilot.generateVoiceResponse(query);

    return NextResponse.json({
      success: true,
      voiceResponse,
      duration: Math.ceil(voiceResponse.length / 10) // Estimate duration in seconds
    });

  } catch (error) {
    console.error('Error generating voice response:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice response' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      message: 'Voice response endpoint is ready',
      useCases: [
        'Bank command centers',
        'Boardroom presentations',
        'Compliance officer briefings',
        'Real-time status updates',
        'Emergency compliance alerts'
      ]
    });
  } catch (error) {
    console.error('Error fetching voice endpoint status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice endpoint status' },
      { status: 500 }
    );
  }
}