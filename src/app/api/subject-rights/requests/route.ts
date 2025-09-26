import { NextRequest, NextResponse } from 'next/server';
import { SubjectRightsService } from '@/lib/subject-rights/SubjectRightsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const requests = await SubjectRightsService.getRequestsByTenant(tenantId);

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching subject rights requests:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subject rights requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requestType,
      requestedBy,
      requestData = {},
      legalBasis,
      jurisdiction,
      priority,
      dueDate,
      metadata = {},
      tenantId = 'system'
    } = body;

    const { request, validation } = await SubjectRightsService.createRequest({
      requestType,
      requestedBy,
      requestData,
      legalBasis,
      jurisdiction,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      metadata,
      tenantId
    });

    return NextResponse.json({ 
      request, 
      validation,
      message: 'Subject rights request created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subject rights request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subject rights request' },
      { status: 500 }
    );
  }
}