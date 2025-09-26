import { NextRequest, NextResponse } from 'next/server';
import { ChaosTestingService } from '@/lib/chaos/ChaosTestingService';

const chaosService = new ChaosTestingService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await chaosService.getExecutionHistory(tenantId, limit);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching chaos test history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}