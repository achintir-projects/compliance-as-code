import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bundleId = params.id;

    const bundle = await db.dslBundle.findUnique({
      where: { id: bundleId }
    });

    if (!bundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    await db.dslBundle.update({
      where: { id: bundleId },
      data: {
        downloads: {
          increment: 1
        }
      }
    });

    const bundleContent = {
      name: bundle.name,
      version: bundle.version,
      description: bundle.description,
      jurisdiction: bundle.jurisdiction,
      category: bundle.category,
      tags: bundle.tags,
      code: bundle.code,
      signature: bundle.signature,
      complianceScore: bundle.complianceScore,
      dependencies: bundle.dependencies,
      publisher: bundle.publisherId,
      createdAt: bundle.createdAt.toISOString(),
      updatedAt: bundle.updatedAt.toISOString()
    };

    const jsonString = JSON.stringify(bundleContent, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${bundle.name.replace(/\s+/g, '_')}_v${bundle.version}.dsl"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error downloading bundle:', error);
    return NextResponse.json(
      { error: 'Failed to download bundle' },
      { status: 500 }
    );
  }
}