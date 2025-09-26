import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const events = await db.healingEvent.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 50
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching healing events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch healing events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, component, description, action, impact } = body;

    const event = await db.healingEvent.create({
      data: {
        type,
        severity,
        component,
        description,
        action,
        impact,
        status: 'PENDING',
        timestamp: new Date()
      }
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error creating healing event:', error);
    return NextResponse.json(
      { error: 'Failed to create healing event' },
      { status: 500 }
    );
  }
}