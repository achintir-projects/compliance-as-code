import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ComplianceAssetGenerator } from '@/lib/compliance-assets/ComplianceAssetGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, deploymentConfig = {} } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId is required' },
        { status: 400 }
      );
    }

    // Get the compliance asset
    const asset = await db.complianceAsset.findUnique({
      where: { id: assetId },
      include: { deployments: true }
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Compliance asset not found' },
        { status: 404 }
      );
    }

    // Generate deployment package
    const generator = new ComplianceAssetGenerator();
    const packageJson = await generator.generateMicroservicePackage(asset);
    
    // Create deployment record
    const deployment = await db.complianceAssetDeployment.create({
      data: {
        assetId: asset.id,
        status: 'deploying',
        config: {
          ...deploymentConfig,
          packageJson,
          deploymentType: deploymentConfig.deploymentType || 'container',
          environment: deploymentConfig.environment || 'production'
        },
        endpoint: generateDeploymentEndpoint(asset),
        metadata: {
          deployedAt: new Date().toISOString(),
          deployedBy: deploymentConfig.deployedBy || 'system',
          version: '1.0.0'
        }
      }
    });

    // Simulate deployment process
    setTimeout(async () => {
      try {
        // In a real implementation, this would:
        // 1. Build container image
        // 2. Push to registry
        // 3. Deploy to Kubernetes/serverless
        // 4. Configure networking and security
        
        await db.complianceAssetDeployment.update({
          where: { id: deployment.id },
          data: {
            status: 'deployed',
            metadata: {
              ...deployment.metadata,
              completedAt: new Date().toISOString(),
              containerId: generateContainerId(),
              podName: generatePodName(asset.name)
            }
          }
        });

        // Update asset status
        await db.complianceAsset.update({
          where: { id: asset.id },
          data: { status: 'deployed' }
        });

      } catch (error) {
        console.error('Deployment failed:', error);
        await db.complianceAssetDeployment.update({
          where: { id: deployment.id },
          data: {
            status: 'failed',
            metadata: {
              ...deployment.metadata,
              error: error.message,
              failedAt: new Date().toISOString()
            }
          }
        });
      }
    }, 5000); // Simulate 5-second deployment

    return NextResponse.json({
      success: true,
      message: 'Deployment initiated',
      deployment: {
        id: deployment.id,
        status: deployment.status,
        endpoint: deployment.endpoint,
        asset: {
          id: asset.id,
          name: asset.name,
          category: asset.category
        }
      }
    });

  } catch (error) {
    console.error('Error deploying compliance asset:', error);
    return NextResponse.json(
      { error: 'Failed to deploy compliance asset', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const status = searchParams.get('status');

    const where: any = {};
    
    if (assetId) {
      where.assetId = assetId;
    }
    
    if (status) {
      where.status = status;
    }

    const deployments = await db.complianceAssetDeployment.findMany({
      where,
      include: {
        asset: true,
        usage: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      deployments,
      count: deployments.length
    });

  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments', details: error.message },
      { status: 500 }
    );
  }
}

function generateDeploymentEndpoint(asset: any): string {
  const normalized = asset.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `https://api.glassbox.ai/compliance/${normalized}`;
}

function generateContainerId(): string {
  return `glassbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generatePodName(assetName: string): string {
  const normalized = assetName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${normalized}-${Date.now()}`;
}