import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const insights = await db.complianceInsight.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    });

    const formattedInsights = insights.map(insight => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      impact: insight.impact,
      confidence: insight.confidence,
      actionable: insight.actionable,
      category: insight.category,
      timestamp: insight.timestamp.toISOString()
    }));

    return NextResponse.json({
      insights: formattedInsights
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, description, impact, confidence, actionable, category } = body;

    if (!type || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insight = await db.complianceInsight.create({
      data: {
        type,
        title,
        description,
        impact: impact || 'MEDIUM',
        confidence: confidence || 85,
        actionable: actionable !== undefined ? actionable : true,
        category
      }
    });

    return NextResponse.json({
      insight: {
        id: insight.id,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        impact: insight.impact,
        confidence: insight.confidence,
        actionable: insight.actionable,
        category: insight.category,
        timestamp: insight.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating insight:', error);
    return NextResponse.json(
      { error: 'Failed to create insight' },
      { status: 500 }
    );
  }
}