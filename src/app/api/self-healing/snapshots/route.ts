import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const snapshots = await db.complianceSnapshot.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    });

    // If no snapshots exist, create initial data
    if (snapshots.length === 0) {
      const initialSnapshots = [
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          score: 98.5,
          issues: 2,
          criticalIssues: 0,
          components: {
            dataPlane: 99,
            agentRuntime: 98,
            complianceEngine: 97,
            knowledgeBase: 99,
            securityLayer: 100
          }
        },
        {
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          score: 96.2,
          issues: 5,
          criticalIssues: 1,
          components: {
            dataPlane: 98,
            agentRuntime: 95,
            complianceEngine: 94,
            knowledgeBase: 97,
            securityLayer: 97
          }
        },
        {
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          score: 94.8,
          issues: 8,
          criticalIssues: 2,
          components: {
            dataPlane: 96,
            agentRuntime: 93,
            complianceEngine: 92,
            knowledgeBase: 96,
            securityLayer: 97
          }
        },
        {
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          score: 97.1,
          issues: 3,
          criticalIssues: 0,
          components: {
            dataPlane: 98,
            agentRuntime: 97,
            complianceEngine: 96,
            knowledgeBase: 98,
            securityLayer: 98
          }
        },
        {
          timestamp: new Date(), // Current
          score: 95.5,
          issues: 6,
          criticalIssues: 1,
          components: {
            dataPlane: 97,
            agentRuntime: 94,
            complianceEngine: 93,
            knowledgeBase: 97,
            securityLayer: 96
          }
        }
      ];

      for (const snapshot of initialSnapshots) {
        await db.complianceSnapshot.create({
          data: snapshot
        });
      }

      return NextResponse.json({ snapshots: initialSnapshots });
    }

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error('Error fetching compliance snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance snapshots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Generate new snapshot data
    const newSnapshot = {
      timestamp: new Date(),
      score: Math.floor(Math.random() * 10) + 90, // Random score between 90-100
      issues: Math.floor(Math.random() * 10), // Random issues 0-9
      criticalIssues: Math.floor(Math.random() * 3), // Random critical issues 0-2
      components: {
        dataPlane: Math.floor(Math.random() * 10) + 90,
        agentRuntime: Math.floor(Math.random() * 10) + 90,
        complianceEngine: Math.floor(Math.random() * 15) + 85,
        knowledgeBase: Math.floor(Math.random() * 10) + 90,
        securityLayer: Math.floor(Math.random() * 5) + 95
      }
    };

    const snapshot = await db.complianceSnapshot.create({
      data: newSnapshot
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Error creating compliance snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create compliance snapshot' },
      { status: 500 }
    );
  }
}