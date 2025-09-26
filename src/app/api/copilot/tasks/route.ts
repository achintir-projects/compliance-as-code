import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const tasks = await db.complianceTask.findMany({
      include: {
        messages: {
          select: {
            id: true,
            type: true,
            content: true,
            timestamp: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      progress: task.progress,
      estimatedTime: task.estimatedTime,
      actualTime: task.actualTime,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      suggestions: task.suggestions || []
    }));

    return NextResponse.json({
      tasks: formattedTasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, assignedTo, estimatedTime } = body;

    if (!title || !description || !priority || !assignedTo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const task = await db.complianceTask.create({
      data: {
        title,
        description,
        status: 'PENDING',
        priority,
        assignedTo,
        progress: 0,
        estimatedTime: estimatedTime || '2h',
        suggestions: []
      }
    });

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        progress: task.progress,
        estimatedTime: task.estimatedTime,
        createdAt: task.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}