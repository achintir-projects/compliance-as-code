import { NextRequest, NextResponse } from 'next/server';
import { SubjectRightsService } from '@/lib/subject-rights/SubjectRightsService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const processedRequest = await SubjectRightsService.processErasureRequest(params.id);

    return NextResponse.json({ 
      request: processedRequest,
      message: 'Erasure request processed successfully'
    });
  } catch (error) {
    console.error('Error processing erasure request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process erasure request' },
      { status: 500 }
    );
  }
}