import { NextRequest, NextResponse } from 'next/server';
import { ConsentService } from '@/lib/consent/ConsentService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const consents = await ConsentService.getConsentsByTenant(tenantId);

    return NextResponse.json({ consents });
  } catch (error) {
    console.error('Error fetching consent objects:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch consent objects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      metadata = {},
      tenantId = 'system'
    } = body;

    const consent = await ConsentService.createConsent({
      knowledgeObjectId,
      decisionBundleId,
      consentType,
      purpose,
      legalBasis,
      retentionPeriod,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      metadata,
      tenantId
    });

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    console.error('Error creating consent object:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create consent object' },
      { status: 500 }
    );
  }
}