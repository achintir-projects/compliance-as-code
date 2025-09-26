import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const messages = await db.complianceChatMessage.findMany({
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    const formattedMessages = messages.map(message => ({
      id: message.id,
      type: message.type,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      suggestions: message.suggestions || []
    }));

    return NextResponse.json({
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, taskId } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const message = await db.complianceChatMessage.create({
      data: {
        type,
        content,
        taskId: taskId || null,
        suggestions: []
      }
    });

    return NextResponse.json({
      message: {
        id: message.id,
        type: message.type,
        content: message.content,
        timestamp: message.timestamp.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}