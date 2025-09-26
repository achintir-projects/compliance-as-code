import { NextRequest, NextResponse } from 'next/server';
import TrustTierSystem from '@/lib/trust/TrustTierSystem';
import { TrustTier } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await TrustTierSystem.getTrustTierStats();
        return NextResponse.json(stats);

      case 'weighted-kos':
        const filters: any = {};
        const options: any = {};

        // Parse filters
        const country = searchParams.get('country');
        const regulationType = searchParams.get('regulationType');
        const category = searchParams.get('category');
        const minConfidence = searchParams.get('minConfidence');

        if (country) filters.country = country;
        if (regulationType) filters.regulationType = regulationType;
        if (category) filters.category = category;
        if (minConfidence) filters.minConfidence = parseFloat(minConfidence);

        // Parse options
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');
        const orderBy = searchParams.get('orderBy');

        if (limit) options.limit = parseInt(limit);
        if (offset) options.offset = parseInt(offset);
        if (orderBy && ['confidence', 'trustTier', 'createdAt'].includes(orderBy)) {
          options.orderBy = orderBy;
        }

        const knowledgeObjects = await TrustTierSystem.getWeightedKnowledgeObjects(
          Object.keys(filters).length > 0 ? filters : undefined,
          Object.keys(options).length > 0 ? options : undefined
        );

        return NextResponse.json({ knowledgeObjects });

      case 'decision-confidence':
        const koIds = searchParams.get('koIds')?.split(',') || [];
        if (koIds.length === 0) {
          return NextResponse.json(
            { error: 'Knowledge object IDs are required' },
            { status: 400 }
          );
        }

        const confidenceScore = await TrustTierSystem.getDecisionConfidenceScore(koIds);
        return NextResponse.json(confidenceScore);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Trust tier system API error:', error);
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
      case 'update-trust-tier':
        const { knowledgeObjectId, newTrustTier, reason } = data;
        
        if (!knowledgeObjectId || !newTrustTier) {
          return NextResponse.json(
            { error: 'Knowledge object ID and new trust tier are required' },
            { status: 400 }
          );
        }

        if (!Object.values(TrustTier).includes(newTrustTier)) {
          return NextResponse.json(
            { error: 'Invalid trust tier' },
            { status: 400 }
          );
        }

        const updated = await TrustTierSystem.updateTrustTier(
          knowledgeObjectId,
          newTrustTier,
          reason
        );

        return NextResponse.json({ updated });

      case 'bulk-update-trust-tier':
        const { sourcePattern, bulkTrustTier } = data;
        
        if (!sourcePattern || !bulkTrustTier) {
          return NextResponse.json(
            { error: 'Source pattern and trust tier are required' },
            { status: 400 }
          );
        }

        if (!Object.values(TrustTier).includes(bulkTrustTier)) {
          return NextResponse.json(
            { error: 'Invalid trust tier' },
            { status: 400 }
          );
        }

        const bulkUpdateResult = await TrustTierSystem.bulkUpdateTrustTierBySource(
          sourcePattern,
          bulkTrustTier
        );

        return NextResponse.json({ bulkUpdateResult });

      case 'validate-trust-tier':
        const { sourceUri, publisher, assignedTrustTier } = data;
        
        if (!sourceUri || !publisher || !assignedTrustTier) {
          return NextResponse.json(
            { error: 'Source URI, publisher, and assigned trust tier are required' },
            { status: 400 }
          );
        }

        const isValid = TrustTierSystem.validateTrustTierAssignment(
          sourceUri,
          publisher,
          assignedTrustTier
        );

        const recommended = TrustTierSystem.getRecommendedTrustTier(sourceUri, publisher);

        return NextResponse.json({
          isValid,
          recommended,
          current: assignedTrustTier
        });

      case 'calculate-confidence':
        const { baseConfidence, trustTier } = data;
        
        if (!baseConfidence || !trustTier) {
          return NextResponse.json(
            { error: 'Base confidence and trust tier are required' },
            { status: 400 }
          );
        }

        if (!['High', 'Medium'].includes(baseConfidence)) {
          return NextResponse.json(
            { error: 'Base confidence must be High or Medium' },
            { status: 400 }
          );
        }

        if (!Object.values(TrustTier).includes(trustTier)) {
          return NextResponse.json(
            { error: 'Invalid trust tier' },
            { status: 400 }
          );
        }

        const adjustment = TrustTierSystem.calculateAdjustedConfidence(
          baseConfidence,
          trustTier
        );

        return NextResponse.json({ adjustment });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Trust tier system API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}