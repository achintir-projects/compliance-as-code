import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeCore } from '@/lib/knowledge/KnowledgeCore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { knowledgeObjectId, decision, comments } = body;

    if (!knowledgeObjectId || !decision) {
      return NextResponse.json({
        success: false,
        message: 'Knowledge object ID and decision are required',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    if (!['approve', 'reject', 'request_changes'].includes(decision)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid decision. Must be: approve, reject, or request_changes',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const knowledgeCore = new KnowledgeCore();
    await knowledgeCore.initialize();

    const result = await knowledgeCore.humanReviewDecision(
      knowledgeObjectId,
      decision,
      comments
    );

    await knowledgeCore.shutdown();

    return NextResponse.json({
      success: result,
      message: result ? 'Human review decision processed successfully' : 'Failed to process human review decision',
      data: {
        knowledgeObjectId,
        decision,
        comments,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in human review:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}