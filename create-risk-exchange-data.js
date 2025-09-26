const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createRiskExchangeData() {
  try {
    console.log('Creating federated risk exchange data...');

    // Create sample network nodes
    const nodes = await Promise.all([
      prisma.networkNode.create({
        data: {
          name: 'UAE Central Bank Node',
          jurisdiction: 'UAE',
          status: 'ONLINE',
          encryptionLevel: 'AES_256_GCM',
        },
      }),
      prisma.networkNode.create({
        data: {
          name: 'UK FCA Node',
          jurisdiction: 'UK',
          status: 'ONLINE',
          encryptionLevel: 'AES_256_GCM',
        },
      }),
      prisma.networkNode.create({
        data: {
          name: 'EU EBA Node',
          jurisdiction: 'EU',
          status: 'ONLINE',
          encryptionLevel: 'AES_256_GCM',
        },
      }),
      prisma.networkNode.create({
        data: {
          name: 'US Federal Reserve Node',
          jurisdiction: 'US',
          status: 'OFFLINE',
          encryptionLevel: 'AES_256_GCM',
        },
      }),
      prisma.networkNode.create({
        data: {
          name: 'Singapore MAS Node',
          jurisdiction: 'Singapore',
          status: 'ONLINE',
          encryptionLevel: 'AES_256_GCM',
        },
      }),
    ]);

    console.log('Created network nodes:', nodes.length);

    // Create sample risk signals
    const signals = await Promise.all([
      prisma.riskSignal.create({
        data: {
          type: 'FRAUD',
          severity: 'HIGH',
          category: 'TRANSACTION',
          description: 'Suspicious transaction pattern detected across multiple UAE financial institutions',
          sourceJurisdiction: 'UAE',
          affectedJurisdictions: JSON.stringify(['UAE', 'UK']),
          confidence: 92,
          isEncrypted: true,
          aggregationMethod: 'FEDERATED_AVERAGING',
          participantCount: 3,
          metadata: JSON.stringify({
            transactionCount: 47,
            amountRange: '10000-50000',
            pattern: 'STRUCTURED',
            detectionMethod: 'ML_PATTERN'
          }),
          contributorId: nodes[0].id,
        },
      }),
      prisma.riskSignal.create({
        data: {
          type: 'AML',
          severity: 'CRITICAL',
          category: 'CUSTOMER',
          description: 'High-risk customer activity detected with cross-border transactions',
          sourceJurisdiction: 'UK',
          affectedJurisdictions: JSON.stringify(['UK', 'EU', 'UAE']),
          confidence: 88,
          isEncrypted: true,
          aggregationMethod: 'SECURE_AGGREGATION',
          participantCount: 4,
          metadata: JSON.stringify({
            customerRiskScore: 95,
            jurisdictions: ['UK', 'EU', 'UAE'],
            transactionVolume: 'HIGH',
            alertType: 'SUSPICIOUS_ACTIVITY'
          }),
          contributorId: nodes[1].id,
        },
      }),
      prisma.riskSignal.create({
        data: {
          type: 'CYBERSECURITY',
          severity: 'HIGH',
          category: 'NETWORK',
          description: 'Increased cyber threats targeting financial institutions in EU region',
          sourceJurisdiction: 'EU',
          affectedJurisdictions: JSON.stringify(['EU', 'UK']),
          confidence: 85,
          isEncrypted: true,
          aggregationMethod: 'FEDERATED_AVERAGING',
          participantCount: 2,
          metadata: JSON.stringify({
            threatType: 'DDOS',
            targetSector: 'FINANCIAL',
            affectedInstitutions: 12,
            mitigationStatus: 'ACTIVE'
          }),
          contributorId: nodes[2].id,
        },
      }),
      prisma.riskSignal.create({
        data: {
          type: 'MARKET_RISK',
          severity: 'MEDIUM',
          category: 'SYSTEM',
          description: 'Market volatility detected in Asian financial markets',
          sourceJurisdiction: 'Singapore',
          affectedJurisdictions: JSON.stringify(['Singapore', 'UAE']),
          confidence: 78,
          isEncrypted: true,
          aggregationMethod: 'DIFFERENTIAL_PRIVACY',
          participantCount: 2,
          metadata: JSON.stringify({
            volatilityIndex: 28.5,
            marketSegment: 'ASIA',
            riskFactors: ['GEOPOLITICAL', 'ECONOMIC'],
            timeWindow: '24H'
          }),
          contributorId: nodes[4].id,
        },
      }),
      prisma.riskSignal.create({
        data: {
          type: 'CREDIT_RISK',
          severity: 'MEDIUM',
          category: 'COMPLIANCE',
          description: 'Credit risk concerns in commercial banking sector',
          sourceJurisdiction: 'UAE',
          affectedJurisdictions: JSON.stringify(['UAE']),
          confidence: 82,
          isEncrypted: true,
          aggregationMethod: 'FEDERATED_AVERAGING',
          participantCount: 1,
          metadata: JSON.stringify({
            sector: 'COMMERCIAL_BANKING',
            riskIndicator: 'NPL_RATIO',
            currentValue: 2.8,
            threshold: 3.0
          }),
          contributorId: nodes[0].id,
        },
      }),
    ]);

    console.log('Created risk signals:', signals.length);

    // Create sample aggregated risks
    const aggregatedRisks = await Promise.all([
      prisma.aggregatedRisk.create({
        data: {
          type: 'FRAUD',
          globalSeverity: 7.2,
          affectedRegions: JSON.stringify(['UAE', 'UK', 'EU']),
          timeWindow: '24h',
          participantCount: 4,
          trend: 'INCREASING',
          privacyMethod: 'DIFFERENTIAL_PRIVACY',
          aggregatedData: JSON.stringify({
            totalSignals: 8,
            severityDistribution: { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 4, 'CRITICAL': 1 },
            regionDistribution: { 'UAE': 3, 'UK': 2, 'EU': 2, 'US': 1 },
            topCategories: ['TRANSACTION', 'CUSTOMER'],
            confidenceRange: [78, 95]
          }),
        },
      }),
      prisma.aggregatedRisk.create({
        data: {
          type: 'CYBERSECURITY',
          globalSeverity: 6.8,
          affectedRegions: JSON.stringify(['EU', 'UK', 'UAE']),
          timeWindow: '7d',
          participantCount: 3,
          trend: 'STABLE',
          privacyMethod: 'SECURE_MULTI_PARTY_COMPUTATION',
          aggregatedData: JSON.stringify({
            totalSignals: 6,
            severityDistribution: { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 0 },
            regionDistribution: { 'EU': 3, 'UK': 2, 'UAE': 1 },
            topCategories: ['NETWORK', 'SYSTEM'],
            confidenceRange: [75, 90]
          }),
        },
      }),
      prisma.aggregatedRisk.create({
        data: {
          type: 'AML',
          globalSeverity: 8.1,
          affectedRegions: JSON.stringify(['UK', 'EU', 'UAE', 'US']),
          timeWindow: '24h',
          participantCount: 5,
          trend: 'DECREASING',
          privacyMethod: 'DIFFERENTIAL_PRIVACY',
          aggregatedData: JSON.stringify({
            totalSignals: 12,
            severityDistribution: { 'LOW': 2, 'MEDIUM': 3, 'HIGH': 5, 'CRITICAL': 2 },
            regionDistribution: { 'UK': 4, 'EU': 3, 'UAE': 3, 'US': 2 },
            topCategories: ['CUSTOMER', 'TRANSACTION'],
            confidenceRange: [80, 95]
          }),
        },
      }),
    ]);

    console.log('Created aggregated risks:', aggregatedRisks.length);

    // Link signals to aggregated risks
    for (let i = 0; i < Math.min(signals.length, aggregatedRisks.length); i++) {
      await prisma.aggregatedRisk.update({
        where: { id: aggregatedRisks[i].id },
        data: {
          sourceSignals: {
            connect: { id: signals[i].id }
          }
        }
      });
    }

    console.log('Linked signals to aggregated risks');
    console.log('Federated risk exchange data creation completed successfully!');

  } catch (error) {
    console.error('Error creating risk exchange data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRiskExchangeData();