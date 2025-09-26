import { NextRequest, NextResponse } from 'next/server';
import { ComplianceAssetGenerator } from '@/lib/compliance-assets/ComplianceAssetGenerator';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { knowledgeObjectIds, options = {} } = body;

    if (!knowledgeObjectIds || !Array.isArray(knowledgeObjectIds)) {
      return NextResponse.json(
        { error: 'knowledgeObjectIds is required and must be an array' },
        { status: 400 }
      );
    }

    const generator = new ComplianceAssetGenerator();
    
    // Generate assets for all requested knowledge objects
    const assets = await generator.generateBatchAssets(knowledgeObjectIds);

    // Store generated assets in database
    const storedAssets = [];
    for (const asset of assets) {
      const storedAsset = await db.complianceAsset.create({
        data: {
          name: asset.name,
          type: asset.type,
          language: asset.language,
          code: asset.code,
          config: asset.config,
          dependencies: asset.dependencies,
          endpoints: asset.endpoints,
          description: asset.description,
          regulation: asset.regulation,
          category: asset.category,
          status: 'generated',
          metadata: {
            generatedAt: new Date().toISOString(),
            sourceKnowledgeObjectId: asset.id.replace('asset_', ''),
            options
          }
        }
      });
      storedAssets.push(storedAsset);
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${assets.length} compliance assets`,
      assets: storedAssets,
      generatedAssets: assets
    });

  } catch (error) {
    console.error('Error generating compliance assets:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance assets', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const regulation = searchParams.get('regulation');
    const status = searchParams.get('status') || 'generated';

    const where: any = { status };
    
    if (category) {
      where.category = category;
    }
    
    if (regulation) {
      where.regulation = { contains: regulation, mode: 'insensitive' };
    }

    const assets = await db.complianceAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        deployments: true,
        usage: true
      }
    });

    return NextResponse.json({
      success: true,
      assets,
      count: assets.length
    });

  } catch (error) {
    console.error('Error fetching compliance assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance assets', details: error.message },
      { status: 500 }
    );
  }
}