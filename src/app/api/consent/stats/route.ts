import { NextRequest, NextResponse } from 'next/server';
import { ConsentService } from '@/lib/consent/ConsentService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const stats = await ConsentService.getConsentStats(tenantId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching consent statistics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch consent statistics' },
      { status: 500 }
    );
  }
}