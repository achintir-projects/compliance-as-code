import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await request.json();
    const { status, progress } = body;

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.progress = 100;
        updateData.actualTime = '1h 45m'; // Simulated actual time
      } else if (status === 'IN_PROGRESS') {
        updateData.progress = progress || 25;
      }
    }
    
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    const task = await db.complianceTask.update({
      where: { id: taskId },
      data: updateData
    });

    return NextResponse.json({
      task: {
        id: task.id,
        status: task.status,
        progress: task.progress,
        updatedAt: task.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}