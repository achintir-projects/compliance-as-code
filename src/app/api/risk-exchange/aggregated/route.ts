import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const aggregatedRisks = await db.aggregatedRisk.findMany({
      include: {
        sourceSignals: {
          select: {
            id: true,
            type: true,
            severity: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedRisks = aggregatedRisks.map(risk => ({
      id: risk.id,
      type: risk.type,
      globalSeverity: risk.globalSeverity,
      affectedRegions: risk.affectedRegions,
      timeWindow: risk.timeWindow,
      participantCount: risk.participantCount,
      trend: risk.trend,
      privacyMethod: risk.privacyMethod,
      aggregatedData: risk.aggregatedData
    }));

    return NextResponse.json({
      risks: formattedRisks
    });
  } catch (error) {
    console.error('Error fetching aggregated risks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch aggregated risks' },
      { status: 500 }
    );
  }
}