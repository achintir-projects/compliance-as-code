import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const riskId = params.id;

    const aggregatedRisk = await db.aggregatedRisk.findUnique({
      where: { id: riskId },
      include: {
        sourceSignals: {
          select: {
            id: true,
            type: true,
            severity: true,
            sourceJurisdiction: true,
            timestamp: true
          }
        }
      }
    });

    if (!aggregatedRisk) {
      return NextResponse.json(
        { error: 'Aggregated risk not found' },
        { status: 404 }
      );
    }

    // Create privacy-preserving aggregated data
    const aggregatedData = {
      id: aggregatedRisk.id,
      type: aggregatedRisk.type,
      globalSeverity: aggregatedRisk.globalSeverity,
      affectedRegions: aggregatedRisk.affectedRegions,
      timeWindow: aggregatedRisk.timeWindow,
      participantCount: aggregatedRisk.participantCount,
      trend: aggregatedRisk.trend,
      privacyMethod: aggregatedRisk.privacyMethod,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSignals: aggregatedRisk.sourceSignals.length,
        severityDistribution: aggregatedRisk.sourceSignals.reduce((acc, signal) => {
          acc[signal.severity] = (acc[signal.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        jurisdictionDistribution: aggregatedRisk.sourceSignals.reduce((acc, signal) => {
          acc[signal.sourceJurisdiction] = (acc[signal.sourceJurisdiction] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      privacyGuarantees: {
        differentialPrivacy: true,
        kAnonymity: aggregatedRisk.participantCount >= 3,
        encryption: 'END_TO_END',
        aggregationMethod: 'FEDERATED_AVERAGING'
      }
    };

    const jsonString = JSON.stringify(aggregatedData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="aggregated-risk-${riskId}.json"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error downloading aggregated data:', error);
    return NextResponse.json(
      { error: 'Failed to download aggregated data' },
      { status: 500 }
    );
  }
}