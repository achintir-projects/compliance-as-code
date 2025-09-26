import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable/AirtableService';

export async function GET() {
  try {
    const airtableService = new AirtableService();
    const stats = await airtableService.getKnowledgeStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting knowledge statistics:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}