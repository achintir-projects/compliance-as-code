import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable/AirtableService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: any = {};

    const confidence = searchParams.get('confidence');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    if (confidence && (confidence === 'High' || confidence === 'Medium')) {
      filters.confidence = confidence;
    }

    if (category) {
      filters.category = category;
    }

    if (status && ['validated', 'pending_review', 'deployed'].includes(status)) {
      filters.status = status;
    }

    const airtableService = new AirtableService();
    const knowledgeObjects = await airtableService.getKnowledgeObjects(filters);

    return NextResponse.json({
      success: true,
      data: knowledgeObjects,
      filters,
      count: knowledgeObjects.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting knowledge objects:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}