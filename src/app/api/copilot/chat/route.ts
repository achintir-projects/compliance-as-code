import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Store user message
    await db.complianceChatMessage.create({
      data: {
        type: 'USER',
        content: message,
        suggestions: []
      }
    });

    // Generate AI response using ZAI
    const zai = await ZAI.create();
    
    const systemPrompt = `You are a Compliance Copilot AI assistant for AURA Financial Services. 
    Your role is to help users with compliance-related tasks, answer questions about regulations, 
    provide insights on compliance matters, and assist with collaborative workflows between humans and AI agents.
    
    Current context:
    - Active compliance tasks: ${context?.activeTasks || 0}
    - Recent AI insights generated: ${context?.recentInsights || 0}
    
    Guidelines:
    1. Be helpful and informative about compliance topics
    2. Provide actionable suggestions when appropriate
    3. Keep responses concise but thorough
    4. When relevant, suggest creating tasks or generating insights
    5. Use professional but approachable language
    6. Focus on financial services compliance (AML, KYC, GDPR, etc.)
    
    Always respond with a JSON object containing:
    {
      "response": "your response text",
      "suggestions": ["array of follow-up suggestions if applicable"]
    }`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    let aiResponse: { response: string; suggestions: string[] };
    
    try {
      aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (parseError) {
      // Fallback if JSON parsing fails
      aiResponse = {
        response: completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.',
        suggestions: []
      };
    }

    // Store AI response
    await db.complianceChatMessage.create({
      data: {
        type: 'ASSISTANT',
        content: aiResponse.response,
        suggestions: aiResponse.suggestions || []
      }
    });

    return NextResponse.json({
      response: aiResponse.response,
      suggestions: aiResponse.suggestions || []
    });
  } catch (error) {
    console.error('Error in chat:', error);
    
    // Store error message
    await db.complianceChatMessage.create({
      data: {
        type: 'ASSISTANT',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        suggestions: []
      }
    });

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}