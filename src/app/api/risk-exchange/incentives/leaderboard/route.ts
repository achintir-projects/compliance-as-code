import { NextRequest, NextResponse } from 'next/server';
import { EconomicIncentivesEngine } from '@/lib/risk-exchange/EconomicIncentives';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeframe = searchParams.get('timeframe') || 'alltime';

    if (!['weekly', 'monthly', 'alltime'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Use: weekly, monthly, or alltime' },
        { status: 400 }
      );
    }

    const engine = new EconomicIncentivesEngine();
    const leaderboard = await engine.getLeaderboard(limit, timeframe as 'weekly' | 'monthly' | 'alltime');

    return NextResponse.json({
      success: true,
      leaderboard,
      timeframe,
      limit,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}