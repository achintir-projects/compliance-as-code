import { NextRequest, NextResponse } from 'next/server';
import { NLToDSLCompiler } from '@/lib/copilot/NLToDSLCompiler';

let compilerInstance: NLToDSLCompiler | null = null;

async function getCompiler(): Promise<NLToDSLCompiler> {
  if (!compilerInstance) {
    compilerInstance = new NLToDSLCompiler();
    await compilerInstance.initialize();
  }
  return compilerInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const compiler = await getCompiler();
    const result = await compiler.processNaturalLanguageQuery(query);

    // Store the query for analytics and improvement
    await storeQueryAnalytics(query, result);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing natural language query:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'suggestions') {
      const suggestions = await getQuerySuggestions();
      return NextResponse.json({
        success: true,
        suggestions
      });
    }

    if (type === 'regulations') {
      const regulations = await getSupportedRegulations();
      return NextResponse.json({
        success: true,
        regulations
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching copilot data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}

async function storeQueryAnalytics(query: string, result: any) {
  // In a real implementation, this would store query analytics
  // for improving the NL processing and understanding user patterns
  console.log('Storing query analytics:', {
    query,
    confidence: result.confidence,
    timestamp: new Date().toISOString()
  });
}

async function getQuerySuggestions() {
  return [
    {
      category: 'Basel III',
      queries: [
        'Show Basel III liquidity coverage ratio for last quarter',
        'Analyze Basel III capital adequacy trends',
        'What are our Basel III compliance levels?'
      ]
    },
    {
      category: 'AML',
      queries: [
        'Show AML transaction monitoring results',
        'Analyze suspicious transaction patterns',
        'What is our AML compliance score?'
      ]
    },
    {
      category: 'KYC',
      queries: [
        'Show KYC verification status',
        'Analyze customer risk levels',
        'How many high-risk customers need enhanced due diligence?'
      ]
    },
    {
      category: 'GDPR',
      queries: [
        'Show GDPR consent status',
        'Analyze data subject requests',
        'What is our GDPR compliance rate?'
      ]
    }
  ];
}

async function getSupportedRegulations() {
  return [
    {
      name: 'Basel III',
      description: 'International regulatory framework for banks',
      metrics: ['Liquidity Coverage Ratio', 'Net Stable Funding Ratio', 'Capital Adequacy'],
      jurisdictions: ['Global', 'US', 'EU', 'UK', 'Asia']
    },
    {
      name: 'AML/BSA',
      description: 'Anti-Money Laundering and Bank Secrecy Act',
      metrics: ['Transaction Monitoring', 'Suspicious Activity Reports', 'Risk Assessment'],
      jurisdictions: ['US', 'Global']
    },
    {
      name: 'KYC/CDD',
      description: 'Know Your Customer and Customer Due Diligence',
      metrics: ['Customer Verification', 'Risk Scoring', 'Enhanced Due Diligence'],
      jurisdictions: ['Global', 'FATF']
    },
    {
      name: 'GDPR',
      description: 'General Data Protection Regulation',
      metrics: ['Consent Management', 'Data Subject Requests', 'Privacy Compliance'],
      jurisdictions: ['EU', 'UK']
    },
    {
      name: 'ESG',
      description: 'Environmental, Social, and Governance',
      metrics: ['Carbon Footprint', 'Social Impact', 'Governance Score'],
      jurisdictions: ['Global', 'EU', 'UK']
    }
  ];
}