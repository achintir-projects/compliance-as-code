import { AgentPackageManifest } from '../agent-package-framework';

export const insuranceManifest: AgentPackageManifest = {
  name: 'Insurance Agent',
  version: '1.0.0',
  description: 'Insurance agent for underwriting, claims processing, and risk modeling',
  type: 'INSURANCE',
  capabilities: [
    'UNDERWRITING',
    'CLAIMS_PROCESSING',
    'RISK_MODELING',
    'POLICY_MANAGEMENT',
    'QUOTE_GENERATION',
    'CLAIM_ANALYSIS'
  ],
  dependencies: [],
  configSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        description: 'Tenant identifier'
      },
      underwritingEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable underwriting functionality'
      },
      claimsProcessingEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable claims processing functionality'
      },
      riskModelingEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable risk modeling functionality'
      },
      policyManagementEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable policy management functionality'
      }
    },
    required: ['tenantId']
  },
  author: 'AURA Financial Services',
  license: 'MIT'
};