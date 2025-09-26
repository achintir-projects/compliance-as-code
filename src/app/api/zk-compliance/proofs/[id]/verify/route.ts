import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update proof verification status
    const proof = await db.zKProof.update({
      where: { id },
      data: {
        verified: true
      }
    });

    return NextResponse.json({ proof });
  } catch (error) {
    console.error('Error verifying ZK proof:', error);
    return NextResponse.json(
      { error: 'Failed to verify ZK proof' },
      { status: 500 }
    );
  }
}