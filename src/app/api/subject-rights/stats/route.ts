import { NextRequest, NextResponse } from 'next/server';
import { SubjectRightsService } from '@/lib/subject-rights/SubjectRightsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const stats = await SubjectRightsService.getSubjectRightsStats(tenantId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching subject rights statistics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subject rights statistics' },
      { status: 500 }
    );
  }
}