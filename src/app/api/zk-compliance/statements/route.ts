import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const statements = await db.complianceStatement.findMany({
      orderBy: {
        lastVerified: 'desc'
      }
    });

    // If no statements exist, create default compliance statements
    if (statements.length === 0) {
      const defaultStatements = [
        {
          regulation: 'Bank Secrecy Act (BSA)',
          jurisdiction: 'United States',
          statement: 'Financial institutions must verify customer identity and report suspicious transactions',
          zkCircuitId: 'circuit_1',
          active: true,
          createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
          lastVerified: new Date(Date.now() - 3600000), // 1 hour ago
          verificationCount: 156
        },
        {
          regulation: 'GDPR Article 32',
          jurisdiction: 'European Union',
          statement: 'Controller and processor shall implement appropriate technical measures to ensure data security',
          zkCircuitId: 'circuit_4',
          active: true,
          createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
          lastVerified: new Date(Date.now() - 7200000), // 2 hours ago
          verificationCount: 89
        },
        {
          regulation: 'FATF Recommendation 10',
          jurisdiction: 'Global',
          statement: 'Financial institutions should conduct customer due diligence including identifying beneficial ownership',
          zkCircuitId: 'circuit_2',
          active: true,
          createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
          lastVerified: new Date(Date.now() - 1800000), // 30 minutes ago
          verificationCount: 234
        },
        {
          regulation: 'AML Directive 5',
          jurisdiction: 'European Union',
          statement: 'Member states shall ensure that customer due diligence is applied to occasional transactions',
          zkCircuitId: 'circuit_1',
          active: true,
          createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
          lastVerified: new Date(Date.now() - 5400000), // 1.5 hours ago
          verificationCount: 178
        },
        {
          regulation: 'CCPA Section 1798.100',
          jurisdiction: 'California, USA',
          statement: 'Business shall inform consumers of the categories of personal information to be collected',
          zkCircuitId: 'circuit_4',
          active: true,
          createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
          lastVerified: new Date(Date.now() - 900000), // 15 minutes ago
          verificationCount: 67
        },
        {
          regulation: 'Basel III Framework',
          jurisdiction: 'Global',
          statement: 'Banks must maintain adequate capital buffers to cover potential losses',
          zkCircuitId: 'circuit_5',
          active: true,
          createdAt: new Date(Date.now() - 86400000 * 14), // 14 days ago
          lastVerified: new Date(Date.now() - 2700000), // 45 minutes ago
          verificationCount: 312
        },
        {
          regulation: 'MiFID II Article 16',
          jurisdiction: 'European Union',
          statement: 'Investment firms must act honestly, fairly and professionally in accordance with best interests',
          zkCircuitId: 'circuit_3',
          active: false,
          createdAt: new Date(Date.now() - 86400000 * 20), // 20 days ago
          lastVerified: new Date(Date.now() - 86400000 * 2), // 2 days ago
          verificationCount: 45
        },
        {
          regulation: 'SOX Section 404',
          jurisdiction: 'United States',
          statement: 'Management must assess and report on internal control over financial reporting',
          zkCircuitId: 'circuit_5',
          active: true,
          createdAt: new Date(Date.now() - 86400000 * 6), // 6 days ago
          lastVerified: new Date(Date.now() - 3600000 * 2), // 2 hours ago
          verificationCount: 128
        }
      ];

      for (const statement of defaultStatements) {
        await db.complianceStatement.create({
          data: statement
        });
      }

      return NextResponse.json({ statements: defaultStatements });
    }

    return NextResponse.json({ statements });
  } catch (error) {
    console.error('Error fetching compliance statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance statements' },
      { status: 500 }
    );
  }
}