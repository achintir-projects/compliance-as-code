import { AgentPackageManifest } from '../agent-package-framework';

export const commercialBankingManifest: AgentPackageManifest = {
  name: 'Commercial Banking Agent',
  version: '1.0.0',
  description: 'Comprehensive commercial banking agent for loan processing, risk assessment, and compliance checking',
  type: 'COMMERCIAL_BANKING',
  capabilities: [
    'LOAN_PROCESSING',
    'RISK_ASSESSMENT',
    'COMPLIANCE_CHECKING',
    'CREDIT_SCORING',
    'CREDIT_DECISION',
    'DOCUMENT_GENERATION'
  ],
  dependencies: [],
  configSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        description: 'Tenant identifier'
      },
      riskAssessmentEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable risk assessment functionality'
      },
      complianceCheckEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable compliance checking functionality'
      },
      loanProcessingEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable loan processing functionality'
      },
      creditScoringEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable credit scoring functionality'
      }
    },
    required: ['tenantId']
  },
  author: 'AURA Financial Services',
  license: 'MIT'
};