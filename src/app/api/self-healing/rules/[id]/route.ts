import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { enabled } = body;

    const rule = await db.healingRule.update({
      where: { id },
      data: {
        enabled,
        lastTriggered: enabled ? new Date() : null
      }
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error updating healing rule:', error);
    return NextResponse.json(
      { error: 'Failed to update healing rule' },
      { status: 500 }
    );
  }
}