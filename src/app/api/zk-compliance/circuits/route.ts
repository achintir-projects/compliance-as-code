import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const circuits = await db.zKCircuit.findMany({
      orderBy: {
        lastUsed: 'desc'
      }
    });

    // If no circuits exist, create default circuits
    if (circuits.length === 0) {
      const defaultCircuits = [
        {
          name: 'AML Compliance Circuit',
          description: 'Zero-knowledge proof for Anti-Money Laundering compliance',
          type: 'GROTH16',
          constraints: 1000000,
          setupComplete: true,
          verificationKey: 'vk_groth16_aml',
          provingKey: 'pk_groth16_aml',
          lastUsed: new Date(Date.now() - 3600000), // 1 hour ago
          performance: {
            provingTime: 2500,
            verificationTime: 5,
            memoryUsage: 512
          }
        },
        {
          name: 'KYC Identity Verification',
          description: 'Know Your Customer identity verification circuit',
          type: 'PLONK',
          constraints: 500000,
          setupComplete: true,
          verificationKey: 'vk_plonk_kyc',
          provingKey: 'pk_plonk_kyc',
          lastUsed: new Date(Date.now() - 7200000), // 2 hours ago
          performance: {
            provingTime: 1800,
            verificationTime: 3,
            memoryUsage: 256
          }
        },
        {
          name: 'Transaction Privacy Circuit',
          description: 'Private transaction validation with compliance checks',
          type: 'STARK',
          constraints: 2000000,
          setupComplete: false,
          verificationKey: 'vk_stark_tx',
          provingKey: 'pk_stark_tx',
          lastUsed: new Date(Date.now() - 86400000), // 1 day ago
          performance: {
            provingTime: 5000,
            verificationTime: 15,
            memoryUsage: 1024
          }
        },
        {
          name: 'GDPR Compliance Proof',
          description: 'General Data Protection Regulation compliance circuit',
          type: 'R1CS',
          constraints: 750000,
          setupComplete: true,
          verificationKey: 'vk_r1cs_gdpr',
          provingKey: 'pk_r1cs_gdpr',
          lastUsed: new Date(Date.now() - 1800000), // 30 minutes ago
          performance: {
            provingTime: 3200,
            verificationTime: 8,
            memoryUsage: 384
          }
        },
        {
          name: 'Risk Assessment Circuit',
          description: 'Privacy-preserving risk assessment calculations',
          type: 'GROTH16',
          constraints: 1500000,
          setupComplete: true,
          verificationKey: 'vk_groth16_risk',
          provingKey: 'pk_groth16_risk',
          lastUsed: new Date(Date.now() - 900000), // 15 minutes ago
          performance: {
            provingTime: 4200,
            verificationTime: 6,
            memoryUsage: 640
          }
        }
      ];

      for (const circuit of defaultCircuits) {
        await db.zKCircuit.create({
          data: circuit
        });
      }

      return NextResponse.json({ circuits: defaultCircuits });
    }

    return NextResponse.json({ circuits });
  } catch (error) {
    console.error('Error fetching ZK circuits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ZK circuits' },
      { status: 500 }
    );
  }
}