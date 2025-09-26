import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeCore } from '@/lib/knowledge/KnowledgeCore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters } = body;

    if (!query) {
      return NextResponse.json({
        success: false,
        message: 'Query is required',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const knowledgeCore = new KnowledgeCore();
    await knowledgeCore.initialize();

    const result = await knowledgeCore.regulatorQuery(query, filters);

    await knowledgeCore.shutdown();

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in regulator query:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}