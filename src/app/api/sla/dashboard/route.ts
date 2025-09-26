import { NextRequest, NextResponse } from 'next/server';
import { SLAService } from '@/lib/sla/SLAService';

const slaService = new SLAService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'system';

    const dashboards = await slaService.getDashboards(tenantId);
    return NextResponse.json({ dashboards });
  } catch (error) {
    console.error('Error fetching SLA dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
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
      widgets,
      tenantId = 'system'
    } = body;

    if (!name || !description || !widgets) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dashboard = await slaService.createDashboard(
      name,
      description,
      widgets,
      tenantId
    );

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    console.error('Error creating SLA dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}