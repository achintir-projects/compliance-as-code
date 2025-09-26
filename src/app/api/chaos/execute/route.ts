import { NextRequest, NextResponse } from 'next/server';
import { ChaosTestingService } from '@/lib/chaos/ChaosTestingService';

const chaosService = new ChaosTestingService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioId, config } = body;

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'Scenario ID is required' },
        { status: 400 }
      );
    }

    const result = await chaosService.executeScenario(scenarioId, config);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error executing chaos test scenario:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute scenario' },
      { status: 500 }
    );
  }
}