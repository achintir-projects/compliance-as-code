import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable/AirtableService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Missing required field: id',
      }, { status: 400 });
    }

    const airtableService = new AirtableService();
    const updatedObject = await airtableService.updateKnowledgeObject(id, updateData);

    if (!updatedObject) {
      return NextResponse.json({
        success: false,
        message: 'Knowledge object not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedObject,
      message: 'Knowledge object updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating knowledge object:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}