import { NextRequest, NextResponse } from 'next/server';

// Auto-sync status and configuration
let autoSyncStatus = {
  isRunning: false,
  lastSync: null as Date | null,
  nextSync: null as Date | null,
  interval: 60, // minutes
};

// Auto-sync timer
let autoSyncTimer: NodeJS.Timeout | null = null;

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: autoSyncStatus,
    });
  } catch (error) {
    console.error('Error getting auto-sync status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get auto-sync status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, interval } = body;

    if (action === 'start') {
      // Stop any existing timer
      if (autoSyncTimer) {
        clearInterval(autoSyncTimer);
        autoSyncTimer = null;
      }

      // Set new interval
      autoSyncStatus.interval = interval || 60;
      autoSyncStatus.isRunning = true;
      autoSyncStatus.lastSync = new Date();
      autoSyncStatus.nextSync = new Date(Date.now() + (autoSyncStatus.interval * 60 * 1000));

      // Start auto-sync timer
      autoSyncTimer = setInterval(async () => {
        try {
          // Call the sync endpoint
          const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/airtable/sync`, {
            method: 'POST',
          });
          
          if (syncResponse.ok) {
            autoSyncStatus.lastSync = new Date();
            autoSyncStatus.nextSync = new Date(Date.now() + (autoSyncStatus.interval * 60 * 1000));
            console.log('Auto-sync completed successfully');
          } else {
            console.error('Auto-sync failed:', await syncResponse.text());
          }
        } catch (error) {
          console.error('Auto-sync error:', error);
        }
      }, autoSyncStatus.interval * 60 * 1000);

      console.log(`Auto-sync started with interval: ${autoSyncStatus.interval} minutes`);
    } else if (action === 'stop') {
      // Stop the timer
      if (autoSyncTimer) {
        clearInterval(autoSyncTimer);
        autoSyncTimer = null;
      }

      autoSyncStatus.isRunning = false;
      autoSyncStatus.nextSync = null;
      console.log('Auto-sync stopped');
    }

    return NextResponse.json({
      success: true,
      status: autoSyncStatus,
    });
  } catch (error) {
    console.error('Error controlling auto-sync:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control auto-sync' },
      { status: 500 }
    );
  }
}