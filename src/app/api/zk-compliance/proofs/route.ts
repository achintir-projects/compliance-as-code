import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const proofs = await db.zKProof.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 50
    });

    return NextResponse.json({ proofs });
  } catch (error) {
    console.error('Error fetching ZK proofs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ZK proofs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { circuitId, publicInputs } = body;

    // Create a new ZK proof
    const proof = await db.zKProof.create({
      data: {
        type: 'COMPLIANCE',
        circuit: circuitId,
        publicInputs,
        proof: `zk_proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        verified: false,
        timestamp: new Date(),
        verifier: 'AURA_ZK_VERIFIER',
        metadata: {
          generationTime: Date.now(),
          inputHash: `hash_${Math.random().toString(36).substr(2, 16)}`
        }
      }
    });

    // Create a new session
    await db.zKSession.create({
      data: {
        participantId: `participant_${Date.now()}`,
        circuitId,
        status: 'PROVING',
        startTime: new Date(),
        publicInputs,
        proof: proof.proof,
        metadata: {
          proofId: proof.id,
          progress: 100
        }
      }
    });

    // Simulate proof generation and verification
    setTimeout(async () => {
      try {
        await db.zKSession.update({
          where: { id: proof.id },
          data: {
            status: 'VERIFIED',
            endTime: new Date()
          }
        });

        await db.zKProof.update({
          where: { id: proof.id },
          data: {
            verified: true
          }
        });
      } catch (error) {
        console.error('Error updating proof verification:', error);
      }
    }, 3000); // 3 seconds to simulate proof generation

    return NextResponse.json({ proof });
  } catch (error) {
    console.error('Error creating ZK proof:', error);
    return NextResponse.json(
      { error: 'Failed to create ZK proof' },
      { status: 500 }
    );
  }
}