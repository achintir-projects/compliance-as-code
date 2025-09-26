import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const jurisdiction = searchParams.get('jurisdiction');
    const search = searchParams.get('search');

    let whereClause: any = {};
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    if (jurisdiction && jurisdiction !== 'all') {
      whereClause.jurisdiction = jurisdiction;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const bundles = await db.dslBundle.findMany({
      where: whereClause,
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            verified: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedBundles = bundles.map(bundle => {
      const avgRating = bundle.reviews.length > 0 
        ? bundle.reviews.reduce((sum, review) => sum + review.rating, 0) / bundle.reviews.length 
        : 0;

      return {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        version: bundle.version,
        publisher: bundle.publisher.name,
        jurisdiction: bundle.jurisdiction,
        category: bundle.category,
        tags: bundle.tags,
        rating: parseFloat(avgRating.toFixed(1)),
        downloads: bundle.downloads,
        lastUpdated: bundle.updatedAt.toISOString(),
        status: bundle.status,
        signature: bundle.signature,
        complianceScore: bundle.complianceScore,
        fileSize: bundle.fileSize,
        dependencies: bundle.dependencies,
        changelog: bundle.changelog,
        preview: bundle.preview
      };
    });

    return NextResponse.json({
      bundles: formattedBundles
    });
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, jurisdiction, tags, code, changelog } = body;

    if (!name || !description || !category || !jurisdiction || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bundle = await db.dslBundle.create({
      data: {
        name,
        description,
        version: '1.0.0',
        jurisdiction,
        category,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        code,
        changelog: changelog ? changelog.split('\n').filter((line: string) => line.trim()) : [],
        preview: code.substring(0, 500) + (code.length > 500 ? '...' : ''),
        signature: `sig_${Math.random().toString(36).substring(7)}`,
        complianceScore: 95,
        fileSize: Buffer.byteLength(code, 'utf8'),
        dependencies: [],
        downloads: 0,
        status: 'published',
        publisherId: 'default-regulator-id'
      }
    });

    return NextResponse.json({
      bundle: {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        version: bundle.version,
        jurisdiction: bundle.jurisdiction,
        category: bundle.category,
        tags: bundle.tags,
        status: bundle.status,
        createdAt: bundle.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 }
    );
  }
}