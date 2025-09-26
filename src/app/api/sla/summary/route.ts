import { NextRequest, NextResponse } from 'next/server';
import { SLAService } from '@/lib/sla/SLAService';

const slaService = new SLAService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const summary = await slaService.getComplianceSummary(tenantId);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching SLA summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}