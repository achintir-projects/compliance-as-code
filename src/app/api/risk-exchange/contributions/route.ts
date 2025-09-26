import { NextRequest, NextResponse } from 'next/server';
import { ContributionScoringSystem } from '@/lib/risk-exchange/ContributionScoringSystem';

let scoringSystem: ContributionScoringSystem | null = null;

async function getScoringSystem(): Promise<ContributionScoringSystem> {
  if (!scoringSystem) {
    scoringSystem = new ContributionScoringSystem();
  }
  return scoringSystem;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      signalType, 
      signalData, 
      confidence, 
      severity = 'medium',
      category = 'general',
      source = 'manual'
    } = body;

    if (!signalType || !signalData || confidence === undefined) {
      return NextResponse.json(
        { error: 'signalType, signalData, and confidence are required' },
        { status: 400 }
      );
    }

    // Get tenant ID from authentication (simplified for demo)
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant';

    const scoring = await getScoringSystem();
    const result = await scoring.processContribution({
      tenantId,
      signalType,
      signalData,
      confidence,
      severity,
      category,
      source
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      points: result.points,
      badges: result.badges,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing contribution:', error);
    return NextResponse.json(
      { error: 'Failed to process contribution', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'demo-tenant';
    const action = searchParams.get('action');

    const scoring = await getScoringSystem();

    if (action === 'score') {
      const score = await scoring.calculateContributionScore(tenantId);
      return NextResponse.json({
        success: true,
        score
      });
    }

    if (action === 'incentives') {
      const incentives = await scoring.getTenantIncentives(tenantId);
      return NextResponse.json({
        success: true,
        incentives
      });
    }

    if (action === 'leaderboard') {
      const period = searchParams.get('period') || 'ALL_TIME';
      const limit = parseInt(searchParams.get('limit') || '50');
      const leaderboard = await scoring.getLeaderboard(period, limit);
      return NextResponse.json({
        success: true,
        leaderboard
      });
    }

    // Get contributions for the tenant
    const contributions = await db.riskExchangeContribution.findMany({
      where: { tenantId },
      include: { verifications: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      contributions,
      count: contributions.length
    });

  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions', details: error.message },
      { status: 500 }
    );
  }
}