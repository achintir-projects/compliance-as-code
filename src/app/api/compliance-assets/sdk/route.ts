import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ComplianceAssetGenerator } from '@/lib/compliance-assets/ComplianceAssetGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, language = 'javascript', options = {} } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId is required' },
        { status: 400 }
      );
    }

    const supportedLanguages = ['javascript', 'python', 'java'];
    if (!supportedLanguages.includes(language)) {
      return NextResponse.json(
        { error: `Unsupported language. Supported: ${supportedLanguages.join(', ')}` },
        { status: 400 }
      );
    }

    // Get the compliance asset
    const asset = await db.complianceAsset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Compliance asset not found' },
        { status: 404 }
      );
    }

    // Generate SDK stub
    const generator = new ComplianceAssetGenerator();
    const sdkCode = await generator.generateSDKStub(asset, language);

    // Create SDK record
    const sdk = await db.regulatorySDK.create({
      data: {
        assetId: asset.id,
        language,
        code: sdkCode,
        version: '1.0.0',
        status: 'generated',
        config: {
          ...options,
          assetName: asset.name,
          assetCategory: asset.category,
          endpoints: asset.endpoints
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: options.generatedBy || 'system',
          downloadCount: 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${language} SDK generated successfully`,
      sdk: {
        id: sdk.id,
        language: sdk.language,
        version: sdk.version,
        downloadUrl: `/api/compliance-assets/sdk/${sdk.id}/download`,
        asset: {
          id: asset.id,
          name: asset.name,
          category: asset.category
        }
      },
      code: sdkCode
    });

  } catch (error) {
    console.error('Error generating SDK:', error);
    return NextResponse.json(
      { error: 'Failed to generate SDK', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const language = searchParams.get('language');

    const where: any = {};
    
    if (assetId) {
      where.assetId = assetId;
    }
    
    if (language) {
      where.language = language;
    }

    const sdks = await db.regulatorySDK.findMany({
      where,
      include: {
        asset: true,
        downloads: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      sdks,
      count: sdks.length
    });

  } catch (error) {
    console.error('Error fetching SDKs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SDKs', details: error.message },
      { status: 500 }
    );
  }
}