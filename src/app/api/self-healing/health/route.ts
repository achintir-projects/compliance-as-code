import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const health = await db.systemHealth.findMany({
      orderBy: {
        lastCheck: 'desc'
      },
      take: 10
    });

    // If no health data exists, create initial data
    if (health.length === 0) {
      const initialHealth = [
        {
          component: 'Data Plane',
          status: 'HEALTHY',
          uptime: 99.9,
          lastCheck: new Date(),
          metrics: {
            cpu: 45,
            memory: 60,
            disk: 75,
            responseTime: 120
          }
        },
        {
          component: 'Agent Runtime',
          status: 'HEALTHY',
          uptime: 99.8,
          lastCheck: new Date(),
          metrics: {
            cpu: 30,
            memory: 45,
            disk: 65,
            responseTime: 80
          }
        },
        {
          component: 'Compliance Engine',
          status: 'DEGRADED',
          uptime: 95.2,
          lastCheck: new Date(),
          metrics: {
            cpu: 75,
            memory: 80,
            disk: 85,
            responseTime: 250
          }
        },
        {
          component: 'Knowledge Base',
          status: 'HEALTHY',
          uptime: 99.5,
          lastCheck: new Date(),
          metrics: {
            cpu: 25,
            memory: 55,
            disk: 70,
            responseTime: 90
          }
        },
        {
          component: 'Security Layer',
          status: 'HEALTHY',
          uptime: 99.9,
          lastCheck: new Date(),
          metrics: {
            cpu: 20,
            memory: 40,
            disk: 60,
            responseTime: 60
          }
        }
      ];

      for (const healthData of initialHealth) {
        await db.systemHealth.create({
          data: healthData
        });
      }

      return NextResponse.json({ health: initialHealth });
    }

    return NextResponse.json({ health });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    );
  }
}