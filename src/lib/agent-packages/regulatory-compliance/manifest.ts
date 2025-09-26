import { AgentPackageManifest } from '../agent-package-framework';

export const regulatoryComplianceManifest: AgentPackageManifest = {
  name: 'Regulatory Compliance Agent',
  version: '1.0.0',
  description: 'Regulatory compliance agent for AML, KYC, and regulatory reporting',
  type: 'REGULATORY_COMPLIANCE',
  capabilities: [
    'AML',
    'KYC',
    'REGULATORY_REPORTING',
    'COMPLIANCE_MONITORING',
    'RISK_ASSESSMENT',
    'VIOLATION_MANAGEMENT',
    'COMPLIANCE_AUDIT'
  ],
  dependencies: [],
  configSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        description: 'Tenant identifier'
      },
      amlEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable AML functionality'
      },
      kycEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable KYC functionality'
      },
      regulatoryReportingEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable regulatory reporting functionality'
      },
      complianceMonitoringEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable compliance monitoring functionality'
      }
    },
    required: ['tenantId']
  },
  author: 'AURA Financial Services',
  license: 'MIT'
};