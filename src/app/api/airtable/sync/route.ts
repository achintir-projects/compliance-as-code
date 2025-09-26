import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable/AirtableService';

export async function POST(request: NextRequest) {
  try {
    const airtableService = new AirtableService();
    const result = await airtableService.syncAirtableData();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        processed: result.processed,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Airtable sync:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const airtableService = new AirtableService();
    const stats = await airtableService.getKnowledgeObjects();
    
    const summary = {
      total: stats.length,
      highConfidence: stats.filter(s => s.confidence === 'High').length,
      mediumConfidence: stats.filter(s => s.confidence === 'Medium').length,
      deployed: stats.filter(s => s.status === 'deployed').length,
      pendingReview: stats.filter(s => s.status === 'pending_review').length,
      validated: stats.filter(s => s.status === 'validated').length,
      categories: [...new Set(stats.map(s => s.category))],
    };

    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting Airtable sync status:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}