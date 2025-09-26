import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable/AirtableService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, objects } = body;

    if (!operation || !objects || !Array.isArray(objects)) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: operation, objects (array)',
      }, { status: 400 });
    }

    const airtableService = new AirtableService();

    switch (operation) {
      case 'create':
        const createResult = await airtableService.bulkCreateKnowledgeObjects(objects);
        return NextResponse.json({
          success: true,
          result: createResult,
          message: `Bulk create completed: ${createResult.success} success, ${createResult.errors} errors`,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: false,
          message: `Unsupported operation: ${operation}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}