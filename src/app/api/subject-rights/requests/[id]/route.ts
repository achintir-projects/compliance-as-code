import { NextRequest, NextResponse } from 'next/server';
import { SubjectRightsService } from '@/lib/subject-rights/SubjectRightsService';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectRightsRequest = await db.subjectRightsRequest.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        },
        consentObjects: {
          include: {
            knowledgeObject: {
              select: {
                id: true,
                topic: true,
                category: true
              }
            },
            decisionBundle: {
              select: {
                id: true,
                agentId: true,
                timestamp: true
              }
            }
          }
        },
        dataErasureLogs: true,
        dataRectificationLogs: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });

    if (!subjectRightsRequest) {
      return NextResponse.json(
        { error: 'Subject rights request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: subjectRightsRequest });
  } catch (error) {
    console.error('Error fetching subject rights request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subject rights request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, response, metadata } = body;

    const existingRequest = await db.subjectRightsRequest.findUnique({
      where: { id: params.id }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Subject rights request not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (response !== undefined) updateData.response = response;
    if (metadata !== undefined) updateData.metadata = { ...existingRequest.metadata, ...metadata };
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedRequest = await db.subjectRightsRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        consentObjects: true,
        dataErasureLogs: true,
        dataRectificationLogs: true
      }
    });

    // Log status update
    await db.auditLog.create({
      data: {
        type: 'SUBJECT_RIGHTS_STATUS_UPDATE',
        resourceId: params.id,
        resourceType: 'SubjectRightsRequest',
        action: 'update',
        before: existingRequest,
        after: updatedRequest,
        metadata: {
          statusChange: existingRequest.status + ' -> ' + (status || existingRequest.status),
          updatedAt: new Date().toISOString()
        },
        subjectRightsRequestId: params.id,
        tenantId: existingRequest.tenantId
      }
    });

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Error updating subject rights request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subject rights request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingRequest = await db.subjectRightsRequest.findUnique({
      where: { id: params.id }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Subject rights request not found' },
        { status: 404 }
      );
    }

    // Mark as expired rather than deleting for audit purposes
    const expiredRequest = await db.subjectRightsRequest.update({
      where: { id: params.id },
      data: {
        status: 'EXPIRED',
        metadata: {
          ...existingRequest.metadata,
          expiredAt: new Date().toISOString(),
          expiredBy: 'system'
        }
      }
    });

    // Log expiration
    await db.auditLog.create({
      data: {
        type: 'SUBJECT_RIGHTS_EXPIRED',
        resourceId: params.id,
        resourceType: 'SubjectRightsRequest',
        action: 'expire',
        before: existingRequest,
        after: expiredRequest,
        metadata: {
          expiredAt: new Date().toISOString()
        },
        subjectRightsRequestId: params.id,
        tenantId: existingRequest.tenantId
      }
    });

    return NextResponse.json({ 
      message: 'Subject rights request expired successfully',
      id: params.id 
    });
  } catch (error) {
    console.error('Error expiring subject rights request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to expire subject rights request' },
      { status: 500 }
    );
  }
}