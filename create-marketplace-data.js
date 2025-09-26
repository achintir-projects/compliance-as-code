const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMarketplaceData() {
  try {
    console.log('Creating marketplace data...');

    // Create sample regulators
    const regulators = await Promise.all([
      prisma.regulator.create({
        data: {
          name: 'Central Bank of UAE',
          jurisdiction: 'UAE',
          verified: true,
        },
      }),
      prisma.regulator.create({
        data: {
          name: 'Financial Conduct Authority',
          jurisdiction: 'UK',
          verified: true,
        },
      }),
      prisma.regulator.create({
        data: {
          name: 'European Banking Authority',
          jurisdiction: 'EU',
          verified: true,
        },
      }),
      prisma.regulator.create({
        data: {
          name: 'Monetary Authority of Singapore',
          jurisdiction: 'Singapore',
          verified: true,
        },
      }),
    ]);

    console.log('Created regulators:', regulators.length);

    // Create sample DSL bundles
    const bundles = await Promise.all([
      prisma.dSLBundle.create({
        data: {
          name: 'UAE AML Regulations 2024',
          description: 'Comprehensive Anti-Money Laundering regulations for UAE financial institutions',
          version: '1.0.0',
          publisherId: regulators[0].id,
          jurisdiction: 'UAE',
          category: 'AML',
          tags: JSON.stringify(['CBUAE', 'AML', '2024', 'financial-institutions']),
          code: `// UAE AML Regulations 2024
rule "Customer Due Diligence" {
  when {
    transaction.amount > 10000
  }
  then {
    require.customer_identification = true
    require.source_of_funds = true
    alert.threshold = "HIGH"
  }
}

rule "Suspicious Activity Reporting" {
  when {
    customer.risk_score > 75
    transaction.pattern matches "suspicious"
  }
  then {
    require.immediate_reporting = true
    alert.type = "SUSPICIOUS_ACTIVITY"
  }
}`,
          preview: '// UAE AML Regulations 2024\nrule "Customer Due Diligence" {\n  when {\n    transaction.amount > 10000\n  }\n  then {\n    require.customer_identification = true\n    require.source_of_funds = true\n    alert.threshold = "HIGH"\n  }\n}',
          signature: 'sig_uae_aml_2024_v1',
          complianceScore: 98,
          fileSize: 1024,
          dependencies: JSON.stringify([]),
          downloads: 150,
          status: 'PUBLISHED',
          changelog: JSON.stringify([
            'Initial release of UAE AML regulations',
            'Added enhanced due diligence requirements',
            'Updated suspicious activity detection rules'
          ]),
        },
      }),
      prisma.dSLBundle.create({
        data: {
          name: 'UK GDPR Compliance Framework',
          description: 'General Data Protection Regulation compliance framework for UK financial services',
          version: '2.1.0',
          publisherId: regulators[1].id,
          jurisdiction: 'UK',
          category: 'Privacy',
          tags: JSON.stringify(['FCA', 'GDPR', 'data-protection', 'privacy']),
          code: `// UK GDPR Compliance Framework
rule "Data Subject Consent" {
  when {
    process.customer_data = true
    consent.valid = false
  }
  then {
    block.processing = true
    alert.type = "CONSENT_VIOLATION"
    action.required = "OBTAIN_CONSENT"
  }
}

rule "Data Retention Policy" {
  when {
    data.age > retention_period
    data.type = "personal"
  }
  then {
    require.data_deletion = true
    alert.type = "RETENTION_POLICY"
  }
}`,
          preview: '// UK GDPR Compliance Framework\nrule "Data Subject Consent" {\n  when {\n    process.customer_data = true\n    consent.valid = false\n  }\n  then {\n    block.processing = true\n    alert.type = "CONSENT_VIOLATION"\n    action.required = "OBTAIN_CONSENT"\n  }\n}',
          signature: 'sig_uk_gdpr_v2_1',
          complianceScore: 96,
          fileSize: 1536,
          dependencies: JSON.stringify([]),
          downloads: 89,
          status: 'PUBLISHED',
          changelog: JSON.stringify([
            'Updated for UK GDPR post-Brexit',
            'Enhanced data subject rights handling',
            'Improved retention policy enforcement'
          ]),
        },
      }),
      prisma.dSLBundle.create({
        data: {
          name: 'EU MiFID II Trading Rules',
          description: 'Markets in Financial Instruments Directive II compliance rules for trading activities',
          version: '1.5.0',
          publisherId: regulators[2].id,
          jurisdiction: 'EU',
          category: 'Risk Management',
          tags: JSON.stringify(['EBA', 'MiFIDII', 'trading', 'risk-management']),
          code: `// EU MiFID II Trading Rules
rule "Best Execution" {
  when {
    order.type = "MARKET"
    execution.quality < best_execution_threshold
  }
  then {
    alert.type = "BEST_EXECUTION_VIOLATION"
    require.review = true
    action.required = "IMPROVE_EXECUTION"
  }
}

rule "Transaction Reporting" {
  when {
    trade.executed = true
    report.submitted = false
    report.deadline < current_time
  }
  then {
    alert.type = "REPORTING_DEADLINE"
    priority = "HIGH"
    action.required = "IMMEDIATE_REPORTING"
  }
}`,
          preview: '// EU MiFID II Trading Rules\nrule "Best Execution" {\n  when {\n    order.type = "MARKET"\n    execution.quality < best_execution_threshold\n  }\n  then {\n    alert.type = "BEST_EXECUTION_VIOLATION"\n    require.review = true\n    action.required = "IMPROVE_EXECUTION"\n  }\n}',
          signature: 'sig_eu_mifid2_v1_5',
          complianceScore: 94,
          fileSize: 2048,
          dependencies: JSON.stringify([]),
          downloads: 67,
          status: 'PUBLISHED',
          changelog: JSON.stringify([
            'Added enhanced best execution monitoring',
            'Improved transaction reporting rules',
            'Updated for latest ESMA guidelines'
          ]),
        },
      }),
      prisma.dSLBundle.create({
        data: {
          name: 'Singapore MAS Notice 626',
          description: 'Technology Risk Management guidelines for financial institutions in Singapore',
          version: '3.0.0',
          publisherId: regulators[3].id,
          jurisdiction: 'Singapore',
          category: 'Compliance',
          tags: JSON.stringify(['MAS', 'technology-risk', 'cybersecurity', 'governance']),
          code: `// Singapore MAS Notice 626
rule "Cybersecurity Framework" {
  when {
    system.criticality = "HIGH"
    security.controls < minimum_requirements
  }
  then {
    alert.type = "CYBERSECURITY_VIOLATION"
    priority = "CRITICAL"
    action.required = "IMMEDIATE_REMEDIATION"
  }
}

rule "Business Continuity Planning" {
  when {
    business_impact = "HIGH"
    bcp.testing_frequency < annual_requirement
  }
  then {
    alert.type = "BCP_COMPLIANCE"
    action.required = "UPDATE_BCP"
    deadline = "30_DAYS"
  }
}`,
          preview: '// Singapore MAS Notice 626\nrule "Cybersecurity Framework" {\n  when {\n    system.criticality = "HIGH"\n    security.controls < minimum_requirements\n  }\n  then {\n    alert.type = "CYBERSECURITY_VIOLATION"\n    priority = "CRITICAL"\n    action.required = "IMMEDIATE_REMEDIATION"\n  }\n}',
          signature: 'sig_mas_notice626_v3_0',
          complianceScore: 97,
          fileSize: 1792,
          dependencies: JSON.stringify([]),
          downloads: 45,
          status: 'PUBLISHED',
          changelog: JSON.stringify([
            'Major update for 2024 requirements',
            'Enhanced cybersecurity controls',
            'Updated business continuity requirements'
          ]),
        },
      }),
    ]);

    console.log('Created DSL bundles:', bundles.length);

    // Create sample reviews
    const reviews = await Promise.all([
      prisma.bundleReview.create({
        data: {
          bundleId: bundles[0].id,
          rating: 5,
          comment: 'Excellent implementation of UAE AML regulations. Very comprehensive and well-structured.',
        },
      }),
      prisma.bundleReview.create({
        data: {
          bundleId: bundles[1].id,
          rating: 4,
          comment: 'Good GDPR framework, but could use more detailed data subject right handling.',
        },
      }),
      prisma.bundleReview.create({
        data: {
          bundleId: bundles[2].id,
          rating: 4,
          comment: 'Solid MiFID II implementation. Covers most key requirements effectively.',
        },
      }),
      prisma.bundleReview.create({
        data: {
          bundleId: bundles[3].id,
          rating: 5,
          comment: 'Outstanding technology risk management framework. Very practical and actionable.',
        },
      }),
    ]);

    console.log('Created reviews:', reviews.length);
    console.log('Marketplace data creation completed successfully!');

  } catch (error) {
    console.error('Error creating marketplace data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMarketplaceData();