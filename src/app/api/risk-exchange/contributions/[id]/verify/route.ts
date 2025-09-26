import { NextRequest, NextResponse } from 'next/server';
import { ContributionScoringSystem } from '@/lib/risk-exchange/ContributionScoringSystem';

let scoringSystem: ContributionScoringSystem | null = null;

async function getScoringSystem(): Promise<ContributionScoringSystem> {
  if (!scoringSystem) {
    scoringSystem = new ContributionScoringSystem();
  }
  return scoringSystem;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { score, feedback } = body;

    if (score === undefined || score < 0 || score > 1) {
      return NextResponse.json(
        { error: 'score is required and must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Get verifier ID from authentication (simplified for demo)
    const verifierId = request.headers.get('x-tenant-id') || 'demo-verifier';

    const scoring = await getScoringSystem();
    const result = await scoring.verifyContribution(
      params.id,
      verifierId,
      score,
      feedback
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
      pointsAdjustment: result.pointsAdjustment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verifying contribution:', error);
    return NextResponse.json(
      { error: 'Failed to verify contribution', details: error.message },
      { status: 500 }
    );
  }
}