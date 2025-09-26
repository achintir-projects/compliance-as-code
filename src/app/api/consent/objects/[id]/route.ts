import { NextRequest, NextResponse } from 'next/server';
import { ConsentService } from '@/lib/consent/ConsentService';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consent = await db.consentObject.findUnique({
      where: { id: params.id },
      include: {
        knowledgeObject: {
          select: {
            id: true,
            topic: true,
            category: true,
            confidence: true,
            country: true,
            regulationType: true
          }
        },
        decisionBundle: {
          select: {
            id: true,
            agentId: true,
            timestamp: true,
            input: true,
            output: true,
            jurisdiction: true,
            residencyRegion: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      }
    });

    if (!consent) {
      return NextResponse.json(
        { error: 'Consent object not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ consent });
  } catch (error) {
    console.error('Error fetching consent object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent object' },
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
    const {
      knowledgeObjectId,
      decisionBundleId,
      consentType,
      purpose,
      legalBasis,
      retentionPeriod,
      expiryDate,
      metadata
    } = body;

    const consent = await ConsentService.updateConsent(params.id, {
      knowledgeObjectId,
      decisionBundleId,
      consentType,
      purpose,
      legalBasis,
      retentionPeriod,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      metadata
    });

    return NextResponse.json({ consent });
  } catch (error) {
    console.error('Error updating consent object:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update consent object' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ConsentService.revokeConsent(params.id, 'Deleted via API');

    return NextResponse.json({ 
      message: 'Consent object revoked successfully',
      id: params.id 
    });
  } catch (error) {
    console.error('Error revoking consent object:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke consent object' },
      { status: 500 }
    );
  }
}