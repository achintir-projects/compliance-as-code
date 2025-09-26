import { NextRequest, NextResponse } from 'next/server';
import { DataPlane, DataSourceConfig } from '@/lib/data-plane/DataPlane';

const dataPlane = new DataPlane();

export async function POST(request: NextRequest) {
  try {
    const config: DataSourceConfig = await request.json();
    
    // Validate required fields
    if (!config.id || !config.name || !config.type || !config.connectionString || !config.tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dataSource = await dataPlane.registerDataSource(config);
    
    return NextResponse.json({
      success: true,
      dataSource: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        status: dataSource.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: dataSource.createdAt
      }
    });
  } catch (error) {
    console.error('Error registering data source:', error);
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

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would query the database
    // For now, return mock data
    const dataSources = [
      {
        id: 'postgres-1',
        name: 'Primary PostgreSQL Database',
        type: 'POSTGRES',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'kafka-1',
        name: 'Transaction Events Kafka',
        type: 'KAFKA',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      dataSources
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}