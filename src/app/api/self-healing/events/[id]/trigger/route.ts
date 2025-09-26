import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update event status to IN_PROGRESS
    const event = await db.healingEvent.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS'
      }
    });

    // Simulate healing process
    setTimeout(async () => {
      try {
        await db.healingEvent.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            resolutionTime: new Date()
          }
        });
      } catch (error) {
        console.error('Error updating healing event:', error);
      }
    }, 5000); // 5 seconds healing time

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error triggering healing:', error);
    return NextResponse.json(
      { error: 'Failed to trigger healing' },
      { status: 500 }
    );
  }
}