import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the SDK
    const sdk = await db.regulatorySDK.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!sdk) {
      return NextResponse.json(
        { error: 'SDK not found' },
        { status: 404 }
      );
    }

    // Update download count
    await db.regulatorySDK.update({
      where: { id },
      data: {
        metadata: {
          ...sdk.metadata,
          downloadCount: (sdk.metadata?.downloadCount || 0) + 1,
          lastDownloadedAt: new Date().toISOString()
        }
      }
    });

    // Create download record
    await db.sDKDownload.create({
      data: {
        sdkId: sdk.id,
        downloadedAt: new Date().toISOString(),
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Generate filename based on language
    const fileExtension = {
      javascript: 'js',
      python: 'py',
      java: 'java'
    }[sdk.language] || 'txt';

    const filename = `glassbox-${sdk.asset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-sdk.${fileExtension}`;

    // Return the SDK code as a downloadable file
    return new NextResponse(sdk.code, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Error downloading SDK:', error);
    return NextResponse.json(
      { error: 'Failed to download SDK', details: error.message },
      { status: 500 }
    );
  }
}