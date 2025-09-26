import { NextRequest, NextResponse } from 'next/server';
import { agentPackageManager } from '@/lib/agent-packages/agent-package-framework';
import { CommercialBankingAgent, commercialBankingManifest } from '@/lib/agent-packages/commercial-banking';
import { PaymentsAgent, paymentsManifest } from '@/lib/agent-packages/payments';
import { InsuranceAgent, insuranceManifest } from '@/lib/agent-packages/insurance';
import { WealthManagementAgent, wealthManagementManifest } from '@/lib/agent-packages/wealth-management';
import { RegulatoryComplianceAgent, regulatoryComplianceManifest } from '@/lib/agent-packages/regulatory-compliance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const packages = agentPackageManager.getAllPackages();
    
    return NextResponse.json({
      packages: packages.map(p => ({
        name: p.manifest.name,
        version: p.manifest.version,
        description: p.manifest.description,
        type: p.manifest.type,
        capabilities: p.manifest.capabilities
      }))
    });
  } catch (error) {
    console.error('Error fetching agent packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageName, tenantId, config } = body;

    if (!packageName || !tenantId) {
      return NextResponse.json(
        { error: 'Package name and tenant ID are required' },
        { status: 400 }
      );
    }

    // Register the appropriate package based on package name
    switch (packageName) {
      case 'Commercial Banking Agent':
        const commercialBankingAgent = new CommercialBankingAgent({
          tenantId,
          ...config
        });
        await agentPackageManager.registerPackage(commercialBankingAgent, commercialBankingManifest);
        break;
      
      case 'Payments Agent':
        const paymentsAgent = new PaymentsAgent({
          tenantId,
          ...config
        });
        await agentPackageManager.registerPackage(paymentsAgent, paymentsManifest);
        break;
      
      case 'Insurance Agent':
        const insuranceAgent = new InsuranceAgent({
          tenantId,
          ...config
        });
        await agentPackageManager.registerPackage(insuranceAgent, insuranceManifest);
        break;
      
      case 'Wealth Management Agent':
        const wealthManagementAgent = new WealthManagementAgent({
          tenantId,
          ...config
        });
        await agentPackageManager.registerPackage(wealthManagementAgent, wealthManagementManifest);
        break;
      
      case 'Regulatory Compliance Agent':
        const regulatoryComplianceAgent = new RegulatoryComplianceAgent({
          tenantId,
          ...config
        });
        await agentPackageManager.registerPackage(regulatoryComplianceAgent, regulatoryComplianceManifest);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown package: ${packageName}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Agent package '${packageName}' registered successfully`,
      packageName,
      tenantId
    });
  } catch (error) {
    console.error('Error registering agent package:', error);
    return NextResponse.json(
      { error: 'Failed to register agent package' },
      { status: 500 }
    );
  }
}