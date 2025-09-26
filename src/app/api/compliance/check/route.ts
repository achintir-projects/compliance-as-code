import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeCore } from '@/lib/knowledge/KnowledgeCore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, category } = body;

    if (!context) {
      return NextResponse.json({
        success: false,
        message: 'Context is required',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const knowledgeCore = new KnowledgeCore();
    await knowledgeCore.initialize();

    const result = await knowledgeCore.executeComplianceCheck(context, category);

    await knowledgeCore.shutdown();

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in compliance check:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}