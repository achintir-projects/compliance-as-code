import { NextRequest, NextResponse } from 'next/server';
import { DataPlane, DataIngestionConfig } from '@/lib/data-plane/DataPlane';

const dataPlane = new DataPlane();

export async function POST(request: NextRequest) {
  try {
    const config: DataIngestionConfig = await request.json();
    
    // Validate required fields
    if (!config.dataSourceId || !config.dataType || !config.tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await dataPlane.startIngestion(config);
    
    return NextResponse.json({
      success: true,
      ingestion: result
    });
  } catch (error) {
    console.error('Error starting ingestion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const dataSourceId = searchParams.get('dataSourceId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would query the database
    // For now, return mock data
    const ingestions = [
      {
        id: 'ingestion-1',
        dataSourceId: 'postgres-1',
        dataType: 'ISO20022',
        status: 'COMPLETED',
        recordCount: 1000,
        errorCount: 0,
        lastSyncAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: 'ingestion-2',
        dataSourceId: 'kafka-1',
        dataType: 'FIBO',
        status: 'RUNNING',
        recordCount: 500,
        errorCount: 2,
        createdAt: new Date().toISOString()
      }
    ].filter(ing => 
      !dataSourceId || ing.dataSourceId === dataSourceId
    );

    return NextResponse.json({
      success: true,
      ingestions
    });
  } catch (error) {
    console.error('Error fetching ingestions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}