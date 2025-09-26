import { NextRequest, NextResponse } from 'next/server';
import { ChaosTestingService } from '@/lib/chaos/ChaosTestingService';

const chaosService = new ChaosTestingService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const dashboard = await chaosService.getResilienceDashboard(tenantId);
    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Error fetching chaos test dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}