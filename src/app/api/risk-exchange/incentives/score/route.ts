import { NextRequest, NextResponse } from 'next/server';
import { EconomicIncentivesEngine } from '@/lib/risk-exchange/EconomicIncentives';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    const engine = new EconomicIncentivesEngine();
    const score = await engine.calculateContributionScore(userId);

    return NextResponse.json({
      success: true,
      score
    });

  } catch (error) {
    console.error('Error calculating contribution score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate contribution score' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const engine = new EconomicIncentivesEngine();
    const tiers = engine.getIncentiveTiers();
    const achievements = engine.getAvailableAchievements();

    return NextResponse.json({
      success: true,
      tiers,
      achievements,
      scoringInfo: {
        weights: {
          fraudReports: 0.3,
          riskSignals: 0.25,
          verifiedIntel: 0.2,
          qualityScore: 0.15,
          timelinessScore: 0.1
        },
        earningRate: '$0.10 per point',
        creditRate: '1 credit per 20 points'
      }
    });
  } catch (error) {
    console.error('Error fetching incentives info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incentives info' },
      { status: 500 }
    );
  }
}