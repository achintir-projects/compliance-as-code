import { NextRequest, NextResponse } from 'next/server';
import { ChaosTestingService } from '@/lib/chaos/ChaosTestingService';
import { ChaosTestCategory, ChaosSeverity } from '@prisma/client';

const chaosService = new ChaosTestingService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const scenarios = await chaosService.getScenarios(tenantId);
    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Error fetching chaos test scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
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
      targetSystem,
      failureMode,
      severity,
      config,
      tenantId = 'system'
    } = body;

    // Validate required fields
    if (!name || !description || !category || !targetSystem || !failureMode || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    if (!Object.values(ChaosTestCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid chaos test category' },
        { status: 400 }
      );
    }

    // Validate severity
    if (!Object.values(ChaosSeverity).includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid chaos test severity' },
        { status: 400 }
      );
    }

    const scenario = await chaosService.createScenario(
      name,
      description,
      category,
      targetSystem,
      failureMode,
      severity,
      config || {},
      tenantId
    );

    return NextResponse.json({ scenario }, { status: 201 });
  } catch (error) {
    console.error('Error creating chaos test scenario:', error);
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}