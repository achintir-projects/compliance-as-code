const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createCopilotData() {
  try {
    console.log('Creating Compliance Copilot data...');

    // Create sample compliance tasks
    const tasks = await Promise.all([
      prisma.complianceTask.create({
        data: {
          title: 'Review UAE AML Regulations Update',
          description: 'Review and analyze the recent updates to UAE AML regulations and assess impact on current compliance framework',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignedTo: 'COLLABORATIVE',
          progress: 65,
          estimatedTime: '4h',
          suggestions: JSON.stringify([
            'Schedule meeting with compliance team to discuss regulatory changes',
            'Update internal AML policies to reflect new requirements',
            'Conduct gap analysis of current controls vs new regulations'
          ])
        },
      }),
      prisma.complianceTask.create({
        data: {
          title: 'Customer Data Privacy Audit',
          description: 'Comprehensive audit of customer data handling practices against GDPR and local privacy regulations',
          status: 'PENDING',
          priority: 'CRITICAL',
          assignedTo: 'HUMAN',
          progress: 0,
          estimatedTime: '8h',
          suggestions: JSON.stringify([
            'Review data collection and consent mechanisms',
            'Assess data retention and deletion policies',
            'Evaluate third-party data sharing agreements'
          ])
        },
      }),
      prisma.complianceTask.create({
        data: {
          title: 'Automate Compliance Reporting',
          description: 'Implement automated system for generating and submitting regulatory compliance reports',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          assignedTo: 'AGENT',
          progress: 100,
          estimatedTime: '6h',
          actualTime: '5h 30m',
          suggestions: JSON.stringify([
            'Deploy automated reporting system to production',
            'Train staff on new reporting workflows',
            'Monitor system performance for first month'
          ])
        },
      }),
      prisma.complianceTask.create({
        data: {
          title: 'Fraud Detection System Enhancement',
          description: 'Enhance existing fraud detection system with new ML models and improve detection accuracy',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignedTo: 'COLLABORATIVE',
          progress: 40,
          estimatedTime: '12h',
          suggestions: JSON.stringify([
            'Evaluate new ML model performance metrics',
            'Conduct A/B testing against current system',
            'Update alert thresholds based on new model performance'
          ])
        },
      }),
      prisma.complianceTask.create({
        data: {
          title: 'Regulatory Change Impact Assessment',
          description: 'Assess impact of recent regulatory changes across all business units and product lines',
          status: 'PENDING',
          priority: 'MEDIUM',
          assignedTo: 'HUMAN',
          progress: 0,
          estimatedTime: '3h',
          suggestions: JSON.stringify([
            'Document all regulatory changes in past quarter',
            'Map changes to affected business processes',
            'Develop implementation timeline for required changes'
          ])
        },
      }),
    ]);

    console.log('Created compliance tasks:', tasks.length);

    // Create sample chat messages
    const messages = await Promise.all([
      prisma.complianceChatMessage.create({
        data: {
          type: 'USER',
          content: 'What are the key requirements for UAE AML compliance in 2024?',
          taskId: tasks[0].id,
          suggestions: [],
          metadata: {}
        },
      }),
      prisma.complianceChatMessage.create({
        data: {
          type: 'ASSISTANT',
          content: 'The key UAE AML compliance requirements for 2024 include enhanced customer due diligence, transaction monitoring systems, suspicious activity reporting, and record retention. The Central Bank of UAE has emphasized the importance of risk-based approaches and technology adoption. Would you like me to elaborate on any specific area?',
          taskId: tasks[0].id,
          suggestions: JSON.stringify([
            'Tell me more about enhanced customer due diligence',
            'What are the technology requirements for transaction monitoring?',
            'Explain the suspicious activity reporting process'
          ]),
          metadata: {}
        },
      }),
      prisma.complianceChatMessage.create({
        data: {
          type: 'USER',
          content: 'Can you help me prioritize our compliance tasks for this quarter?',
          taskId: null,
          suggestions: [],
          metadata: {}
        },
      }),
      prisma.complianceChatMessage.create({
        data: {
          type: 'ASSISTANT',
          content: 'Based on your current tasks, I recommend prioritizing the Customer Data Privacy Audit (Critical) and UAE AML Regulations Review (High) first. The Fraud Detection System Enhancement can run in parallel. Would you like me to create a detailed project plan for these priorities?',
          taskId: null,
          suggestions: JSON.stringify([
            'Create detailed project plan for high-priority tasks',
            'Suggest resource allocation for concurrent tasks',
            'Recommend timeline for all compliance activities'
          ]),
          metadata: {}
        },
      }),
    ]);

    console.log('Created chat messages:', messages.length);

    // Create sample insights
    const insights = await Promise.all([
      prisma.complianceInsight.create({
        data: {
          type: 'RISK',
          title: 'Increased Regulatory Scrutiny on Cross-Border Transactions',
          description: 'Recent regulatory changes indicate increased focus on cross-border transaction monitoring. Current systems may need enhancement to meet new requirements.',
          impact: 'HIGH',
          confidence: 92,
          actionable: true,
          category: 'AML Compliance',
          metadata: {}
        },
      }),
      prisma.complianceInsight.create({
        data: {
          type: 'OPPORTUNITY',
          title: 'AI-Powered Compliance Monitoring Can Reduce Manual Work by 40%',
          description: 'Analysis of current compliance workflows shows significant opportunity for automation using AI and machine learning technologies.',
          impact: 'MEDIUM',
          confidence: 87,
          actionable: true,
          category: 'Process Optimization',
          metadata: {}
        },
      }),
      prisma.complianceInsight.create({
        data: {
          type: 'COMPLIANCE',
          title: 'GDPR Compliance Gap in Customer Data Processing',
          description: 'Review of current data processing practices reveals potential gaps in GDPR compliance, particularly around data subject rights and consent management.',
          impact: 'HIGH',
          confidence: 89,
          actionable: true,
          category: 'Data Privacy',
          metadata: {}
        },
      }),
      prisma.complianceInsight.create({
        data: {
          type: 'OPTIMIZATION',
          title: 'Streamline Regulatory Change Management Process',
          description: 'Current regulatory change management process can be optimized by implementing centralized tracking and automated impact assessment workflows.',
          impact: 'MEDIUM',
          confidence: 85,
          actionable: true,
          category: 'Governance',
          metadata: {}
        },
      }),
    ]);

    console.log('Created compliance insights:', insights.length);
    console.log('Compliance Copilot data creation completed successfully!');

  } catch (error) {
    console.error('Error creating copilot data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCopilotData();