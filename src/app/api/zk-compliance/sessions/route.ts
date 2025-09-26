import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessions = await db.zKSession.findMany({
      orderBy: {
        startTime: 'desc'
      },
      take: 30
    });

    // If no sessions exist, create some sample sessions
    if (sessions.length === 0) {
      const sampleSessions = [
        {
          participantId: 'participant_001',
          circuitId: 'circuit_1',
          status: 'VERIFIED' as const,
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          endTime: new Date(Date.now() - 3570000), // 3 minutes duration
          proof: 'zk_proof_001_verified',
          publicInputs: ['customer_id_123', 'transaction_amount_5000'],
          metadata: {
            proofId: 'proof_001',
            progress: 100,
            verificationTime: 5000
          }
        },
        {
          participantId: 'participant_002',
          circuitId: 'circuit_2',
          status: 'PROVING' as const,
          startTime: new Date(Date.now() - 1800000), // 30 minutes ago
          publicInputs: ['user_id_456', 'document_hash_abc123'],
          metadata: {
            proofId: 'proof_002',
            progress: 75,
            estimatedTimeRemaining: 45000
          }
        },
        {
          participantId: 'participant_003',
          circuitId: 'circuit_4',
          status: 'VERIFIED' as const,
          startTime: new Date(Date.now() - 7200000), // 2 hours ago
          endTime: new Date(Date.now() - 7140000), // 6 minutes duration
          proof: 'zk_proof_003_verified',
          publicInputs: ['data_subject_789', 'processing_purpose_consent'],
          metadata: {
            proofId: 'proof_003',
            progress: 100,
            verificationTime: 8000
          }
        },
        {
          participantId: 'participant_004',
          circuitId: 'circuit_5',
          status: 'FAILED' as const,
          startTime: new Date(Date.now() - 5400000), // 1.5 hours ago
          endTime: new Date(Date.now() - 5380000), // 2 minutes duration
          publicInputs: ['risk_score_calculation', 'portfolio_data_xyz'],
          metadata: {
            proofId: 'proof_004',
            progress: 25,
            error: 'Insufficient memory for proof generation'
          }
        },
        {
          participantId: 'participant_005',
          circuitId: 'circuit_3',
          status: 'INITIATED' as const,
          startTime: new Date(Date.now() - 900000), // 15 minutes ago
          publicInputs: ['transaction_batch_999'],
          metadata: {
            proofId: 'proof_005',
            progress: 10,
            estimatedTimeRemaining: 180000
          }
        }
      ];

      for (const session of sampleSessions) {
        await db.zKSession.create({
          data: session
        });
      }

      return NextResponse.json({ sessions: sampleSessions });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching ZK sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ZK sessions' },
      { status: 500 }
    );
  }
}