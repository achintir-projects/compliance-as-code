import { NextRequest, NextResponse } from 'next/server';
import { deduplicationEngine } from '@/lib/deduplication/DeduplicationEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await deduplicationEngine.getDeduplicationStats();
        return NextResponse.json(stats);

      case 'config':
        const config = deduplicationEngine.getConfig();
        return NextResponse.json(config);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Deduplication engine API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'check-duplicate':
        const { knowledgeObject, checkConfig } = data;
        
        if (!knowledgeObject) {
          return NextResponse.json(
            { error: 'Knowledge object is required' },
            { status: 400 }
          );
        }

        const result = await deduplicationEngine.checkDuplicate(
          knowledgeObject,
          checkConfig
        );

        return NextResponse.json(result);

      case 'batch-deduplicate':
        const { knowledgeObjects, batchConfig } = data;
        
        if (!knowledgeObjects || !Array.isArray(knowledgeObjects)) {
          return NextResponse.json(
            { error: 'Knowledge objects array is required' },
            { status: 400 }
          );
        }

        const batchResult = await deduplicationEngine.batchDeduplicate(
          knowledgeObjects,
          batchConfig
        );

        return NextResponse.json(batchResult);

      case 'cleanup-duplicates':
        const { keepStrategy } = data;
        
        if (keepStrategy && !['newest', 'oldest', 'highest-trust'].includes(keepStrategy)) {
          return NextResponse.json(
            { error: 'Keep strategy must be one of: newest, oldest, highest-trust' },
            { status: 400 }
          );
        }

        const cleanupResult = await deduplicationEngine.cleanupDuplicates(
          keepStrategy || 'newest'
        );

        return NextResponse.json(cleanupResult);

      case 'update-config':
        const { newConfig } = data;
        
        if (!newConfig || typeof newConfig !== 'object') {
          return NextResponse.json(
            { error: 'New configuration must be an object' },
            { status: 400 }
          );
        }

        deduplicationEngine.updateConfig(newConfig);
        return NextResponse.json({ 
          message: 'Configuration updated successfully',
          config: deduplicationEngine.getConfig()
        });

      case 'generate-fingerprint':
        const { content } = data;
        
        if (!content || typeof content !== 'string') {
          return NextResponse.json(
            { error: 'Content is required and must be a string' },
            { status: 400 }
          );
        }

        const fingerprint = deduplicationEngine['generateContentFingerprint'](content);
        return NextResponse.json({ fingerprint });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Deduplication engine API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}