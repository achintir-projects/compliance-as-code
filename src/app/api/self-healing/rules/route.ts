import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const rules = await db.healingRule.findMany({
      orderBy: {
        priority: 'asc'
      }
    });

    // If no rules exist, create default rules
    if (rules.length === 0) {
      const defaultRules = [
        {
          name: 'High CPU Usage Alert',
          description: 'Alert when CPU usage exceeds 80% for 5 minutes',
          condition: 'cpu > 80 && duration > 300',
          action: 'ALERT',
          enabled: true,
          priority: 1,
          successRate: 95.5
        },
        {
          name: 'Memory Leak Auto-Revert',
          description: 'Auto-revert when memory usage exceeds 90%',
          condition: 'memory > 90',
          action: 'AUTO_REVERT',
          enabled: true,
          priority: 2,
          successRate: 88.2
        },
        {
          name: 'Service Degradation Detection',
          description: 'Detect and alert on service degradation',
          condition: 'responseTime > 500 || status == "DEGRADED"',
          action: 'ALERT',
          enabled: true,
          priority: 3,
          successRate: 92.1
        },
        {
          name: 'Critical Component Failure',
          description: 'Manual intervention for critical component failures',
          condition: 'status == "CRITICAL"',
          action: 'MANUAL_INTERVENTION',
          enabled: true,
          priority: 1,
          successRate: 78.5
        },
        {
          name: 'Preventive Health Check',
          description: 'Run preventive health checks periodically',
          condition: 'uptime < 95 || disk > 85',
          action: 'PREVENTIVE',
          enabled: true,
          priority: 4,
          successRate: 96.8
        }
      ];

      for (const rule of defaultRules) {
        await db.healingRule.create({
          data: rule
        });
      }

      return NextResponse.json({ rules: defaultRules });
    }

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching healing rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch healing rules' },
      { status: 500 }
    );
  }
}