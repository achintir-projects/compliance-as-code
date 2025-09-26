import { NextRequest, NextResponse } from 'next/server';
import { ConsentService } from '@/lib/consent/ConsentService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { reason } = body;

    const revokedConsent = await ConsentService.revokeConsent(params.id, reason);

    return NextResponse.json({ 
      message: 'Consent revoked successfully',
      consent: revokedConsent 
    });
  } catch (error) {
    console.error('Error revoking consent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke consent' },
      { status: 500 }
    );
  }
}