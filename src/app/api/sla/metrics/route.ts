import { NextRequest, NextResponse } from 'next/server';
import { SLAService } from '@/lib/sla/SLAService';

const slaService = new SLAService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';
    const period = searchParams.get('period') || undefined;

    const metrics = await slaService.getSLAMetrics(tenantId, period);
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching SLA metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}