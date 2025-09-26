import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    console.error('Error publishing bundle:', error);
    return NextResponse.json(
      { error: 'Failed to publish bundle' },
      { status: 500 }
    );
  }
}