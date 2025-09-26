import { NextRequest, NextResponse } from 'next/server';
import { agentPackageManager } from '@/lib/agent-packages/agent-package-framework';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageName, version, task, data, tenantId, metadata } = body;

    if (!packageName || !version || !task || !tenantId) {
      return NextResponse.json(
        { error: 'Package name, version, task, and tenant ID are required' },
        { status: 400 }
      );
    }

    const context = {
      task,
      data: data || {},
      metadata: metadata || {},
      tenantId
    };

    const result = await agentPackageManager.executePackage(packageName, version, context);

    return NextResponse.json({
      result,
      packageName,
      version,
      task,
      executedAt: new Date()
    });
  } catch (error) {
    console.error('Error executing agent package:', error);
    return NextResponse.json(
      { error: 'Failed to execute agent package' },
      { status: 500 }
    );
  }
}