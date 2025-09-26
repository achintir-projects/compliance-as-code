import { NextRequest, NextResponse } from 'next/server';
import { regulatoryFetcher } from '@/lib/regulatory/RegulatoryFetcher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sourceId = searchParams.get('sourceId');

    switch (action) {
      case 'sources':
        const sources = regulatoryFetcher.getSources();
        return NextResponse.json({ sources });

      case 'sync':
        if (!sourceId) {
          return NextResponse.json(
            { error: 'Source ID is required for sync action' },
            { status: 400 }
          );
        }
        
        await regulatoryFetcher.syncSource(sourceId);
        return NextResponse.json({ 
          message: `Successfully synced source: ${sourceId}` 
        });

      case 'sync-all':
        await regulatoryFetcher.syncAllSources();
        return NextResponse.json({ 
          message: 'Successfully synced all regulatory sources' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Regulatory fetcher API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, sourceId, config } = await request.json();

    switch (action) {
      case 'sync':
        if (!sourceId) {
          return NextResponse.json(
            { error: 'Source ID is required for sync action' },
            { status: 400 }
          );
        }
        
        await regulatoryFetcher.syncSource(sourceId);
        return NextResponse.json({ 
          message: `Successfully synced source: ${sourceId}` 
        });

      case 'sync-all':
        await regulatoryFetcher.syncAllSources();
        return NextResponse.json({ 
          message: 'Successfully synced all regulatory sources' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Regulatory fetcher API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}