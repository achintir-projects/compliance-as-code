import { NextRequest, NextResponse } from 'next/server';
import { AirtableService } from '@/lib/airtable/AirtableService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      confidence, 
      topic, 
      category, 
      content, 
      country = 'Global',
      regulationType = 'General',
      effectiveDate = new Date().toISOString().split('T')[0]
    } = body;

    if (!confidence || !topic || !category || !content) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: confidence, topic, category, content',
      }, { status: 400 });
    }

    const airtableService = new AirtableService();
    const knowledgeObject = await airtableService.createKnowledgeObject({
      confidence,
      topic,
      category,
      content,
      country,
      regulationType,
      effectiveDate,
    });

    return NextResponse.json({
      success: true,
      data: knowledgeObject,
      message: 'Knowledge object created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating knowledge object:', error);
    return NextResponse.json({
      success: false,
      message: `Internal server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}