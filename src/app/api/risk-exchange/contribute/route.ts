import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, category, description, affectedJurisdictions, metadata } = body;

    if (!type || !severity || !category || !description || !affectedJurisdictions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the risk signal with privacy-preserving features
    const signal = await db.riskSignal.create({
      data: {
        type,
        severity,
        category,
        description,
        sourceJurisdiction: 'UAE', // Default to UAE for this implementation
        affectedJurisdictions: affectedJurisdictions,
        confidence: Math.floor(Math.random() * 20) + 80, // Random confidence between 80-100
        isEncrypted: true,
        aggregationMethod: 'FEDERATED_AVERAGING',
        participantCount: 1,
        metadata: metadata || {},
        contributorId: 'default-node-id'
      }
    });

    // Trigger aggregation process (simplified for demo)
    await triggerAggregation(signal.type, affectedJurisdictions);

    return NextResponse.json({
      signal: {
        id: signal.id,
        type: signal.type,
        severity: signal.severity,
        category: signal.category,
        description: signal.description,
        timestamp: signal.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Error contributing risk signal:', error);
    return NextResponse.json(
      { error: 'Failed to contribute risk signal' },
      { status: 500 }
    );
  }
}

async function triggerAggregation(type: string, affectedJurisdictions: string[]) {
  try {
    // Simulate federated aggregation by creating an aggregated risk entry
    const existingAggregation = await db.aggregatedRisk.findFirst({
      where: {
        type: type,
        affectedRegions: {
          hasSome: affectedJurisdictions
        }
      }
    });

    if (existingAggregation) {
      // Update existing aggregation
      await db.aggregatedRisk.update({
        where: { id: existingAggregation.id },
        data: {
          participantCount: {
            increment: 1
          },
          globalSeverity: {
            increment: Math.random() * 0.1
          },
          updatedAt: new Date()
        }
      });
    } else {
      // Create new aggregation
      await db.aggregatedRisk.create({
        data: {
          type,
          globalSeverity: Math.random() * 5 + 3, // Random severity between 3-8
          affectedRegions: affectedJurisdictions,
          timeWindow: '24h',
          participantCount: 1,
          trend: 'STABLE',
          privacyMethod: 'DIFFERENTIAL_PRIVACY',
          aggregatedData: {
            signalCount: 1,
            regions: affectedJurisdictions,
            lastUpdate: new Date().toISOString()
          }
        }
      });
    }
  } catch (error) {
    console.error('Error triggering aggregation:', error);
  }
}