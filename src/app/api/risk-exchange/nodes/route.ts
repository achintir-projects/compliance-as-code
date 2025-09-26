import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const nodes = await db.networkNode.findMany({
      include: {
        contributedSignals: {
          select: {
            id: true
          }
        },
        receivedSignals: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        lastSync: 'desc'
      }
    });

    const formattedNodes = nodes.map(node => ({
      id: node.id,
      name: node.name,
      jurisdiction: node.jurisdiction,
      status: node.status,
      lastSync: node.lastSync.toISOString(),
      riskSignalsContributed: node.contributedSignals.length,
      riskSignalsReceived: node.receivedSignals.length,
      encryptionLevel: node.encryptionLevel
    }));

    return NextResponse.json({
      nodes: formattedNodes
    });
  } catch (error) {
    console.error('Error fetching network nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network nodes' },
      { status: 500 }
    );
  }
}