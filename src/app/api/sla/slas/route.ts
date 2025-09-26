import { NextRequest, NextResponse } from 'next/server';
import { SLAService } from '@/lib/sla/SLAService';
import { SLACategory, SLATimeframe } from '@prisma/client';

const slaService = new SLAService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const slas = await slaService.getSLAs(tenantId);
    return NextResponse.json({ slas });
  } catch (error) {
    console.error('Error fetching SLAs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SLAs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      targetValue,
      warningThreshold,
      criticalThreshold,
      timeframe,
      tenantId = 'system'
    } = body;

    // Validate required fields
    if (!name || !description || !category || targetValue === undefined || 
        warningThreshold === undefined || criticalThreshold === undefined || !timeframe) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    if (!Object.values(SLACategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid SLA category' },
        { status: 400 }
      );
    }

    // Validate timeframe
    if (!Object.values(SLATimeframe).includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid SLA timeframe' },
        { status: 400 }
      );
    }

    // Validate thresholds
    if (targetValue <= warningThreshold || warningThreshold <= criticalThreshold) {
      return NextResponse.json(
        { error: 'Invalid threshold values: target > warning > critical required' },
        { status: 400 }
      );
    }

    const sla = await slaService.createSLA(
      name,
      description,
      category,
      targetValue,
      warningThreshold,
      criticalThreshold,
      timeframe,
      tenantId
    );

    return NextResponse.json({ sla }, { status: 201 });
  } catch (error) {
    console.error('Error creating SLA:', error);
    return NextResponse.json(
      { error: 'Failed to create SLA' },
      { status: 500 }
    );
  }
}