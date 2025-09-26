import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    // Get current compliance data for context
    const [tasks, recentMessages] = await Promise.all([
      db.complianceTask.findMany({
        where: { status: { not: 'COMPLETED' } },
        select: { title: true, status: true, priority: true }
      }),
      db.complianceChatMessage.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: { content: true, type: true }
      })
    ]);

    const zai = await ZAI.create();
    
    const systemPrompt = `You are an AI compliance analyst for AURA Financial Services. 
    Analyze the current compliance context and generate actionable insights.
    
    Current context:
    - Active compliance tasks: ${tasks.length}
    - Task priorities: ${tasks.map(t => t.priority).join(', ')}
    - Recent activity: ${recentMessages.length} recent messages
    
    Generate insights in the following categories:
    1. RISK - Potential compliance risks or issues
    2. OPPORTUNITY - Opportunities for improvement or optimization
    3. COMPLIANCE - Compliance-related observations or recommendations
    4. OPTIMIZATION - Process or workflow optimization suggestions
    
    For each insight, provide:
    - Type (RISK/OPPORTUNITY/COMPLIANCE/OPTIMIZATION)
    - Title (concise, actionable)
    - Description (detailed explanation)
    - Impact (LOW/MEDIUM/HIGH)
    - Confidence (70-100)
    - Actionable (true/false)
    - Category (specific compliance area)
    
    Respond with a JSON array of insights.`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: 'Generate compliance insights based on the current context.'
        }
      ],
      temperature: 0.8,
      max_tokens: 800
    });

    let insights: any[];
    
    try {
      insights = JSON.parse(completion.choices[0]?.message?.content || '[]');
    } catch (parseError) {
      // Fallback insights if JSON parsing fails
      insights = [
        {
          type: 'COMPLIANCE',
          title: 'Regular Compliance Review Recommended',
          description: 'Based on current activity, a comprehensive compliance review is recommended to ensure all requirements are met.',
          impact: 'MEDIUM',
          confidence: 85,
          actionable: true,
          category: 'General Compliance'
        }
      ];
    }

    // Store generated insights
    for (const insight of insights) {
      await db.complianceInsight.create({
        data: {
          type: insight.type,
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          confidence: insight.confidence,
          actionable: insight.actionable,
          category: insight.category
        }
      });
    }

    return NextResponse.json({
      insights: insights.map(insight => ({
        ...insight,
        timestamp: new Date().toISOString()
      })),
      count: insights.length
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}