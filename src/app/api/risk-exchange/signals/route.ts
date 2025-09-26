import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const jurisdiction = searchParams.get('jurisdiction');

    let whereClause: any = {};
    
    if (type) {
      whereClause.type = type;
    }
    
    if (severity) {
      whereClause.severity = severity;
    }
    
    if (jurisdiction) {
      whereClause.sourceJurisdiction = jurisdiction;
    }

    const signals = await db.riskSignal.findMany({
      where: whereClause,
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            jurisdiction: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    const formattedSignals = signals.map(signal => ({
      id: signal.id,
      type: signal.type,
      severity: signal.severity,
      category: signal.category,
      description: signal.description,
      sourceJurisdiction: signal.sourceJurisdiction,
      affectedJurisdictions: signal.affectedJurisdictions,
      timestamp: signal.timestamp.toISOString(),
      confidence: signal.confidence,
      isEncrypted: signal.isEncrypted,
      aggregationMethod: signal.aggregationMethod,
      participantCount: signal.participantCount,
      metadata: signal.metadata
    }));

    return NextResponse.json({
      signals: formattedSignals
    });
  } catch (error) {
    console.error('Error fetching risk signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk signals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, category, description, sourceJurisdiction, affectedJurisdictions, confidence, isEncrypted, aggregationMethod, participantCount, metadata } = body;

    if (!type || !severity || !category || !description || !sourceJurisdiction) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const signal = await db.riskSignal.create({
      data: {
        type,
        severity,
        category,
        description,
        sourceJurisdiction,
        affectedJurisdictions: affectedJurisdictions || [],
        confidence: confidence || 85,
        isEncrypted: isEncrypted || true,
        aggregationMethod: aggregationMethod || 'FEDERATED_AVERAGING',
        participantCount: participantCount || 1,
        metadata: metadata || {},
        contributorId: 'default-node-id'
      }
    });

    return NextResponse.json({
      signal: {
        id: signal.id,
        type: signal.type,
        severity: signal.severity,
        category: signal.category,
        description: signal.description,
        sourceJurisdiction: signal.sourceJurisdiction,
        timestamp: signal.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating risk signal:', error);
    return NextResponse.json(
      { error: 'Failed to create risk signal' },
      { status: 500 }
    );
  }
}