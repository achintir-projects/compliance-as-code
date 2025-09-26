import { AgentPackageManifest } from '../agent-package-framework';

export const paymentsManifest: AgentPackageManifest = {
  name: 'Payments Agent',
  version: '1.0.0',
  description: 'Payment processing agent with transaction handling, fraud detection, and settlement capabilities',
  type: 'PAYMENTS',
  capabilities: [
    'TRANSACTION_PROCESSING',
    'FRAUD_DETECTION',
    'SETTLEMENT',
    'RECONCILIATION',
    'REVERSAL',
    'STATUS_TRACKING'
  ],
  dependencies: [],
  configSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        description: 'Tenant identifier'
      },
      fraudDetectionEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable fraud detection functionality'
      },
      transactionProcessingEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable transaction processing functionality'
      },
      settlementEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable payment settlement functionality'
      },
      reconciliationEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable transaction reconciliation functionality'
      }
    },
    required: ['tenantId']
  },
  author: 'AURA Financial Services',
  license: 'MIT'
};