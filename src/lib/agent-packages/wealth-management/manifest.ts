import { AgentPackageManifest } from '../agent-package-framework';

export const wealthManagementManifest: AgentPackageManifest = {
  name: 'Wealth Management Agent',
  version: '1.0.0',
  description: 'Wealth management agent for portfolio optimization, financial planning, and market analysis',
  type: 'WEALTH_MANAGEMENT',
  capabilities: [
    'PORTFOLIO_OPTIMIZATION',
    'FINANCIAL_PLANNING',
    'MARKET_ANALYSIS',
    'RISK_MANAGEMENT',
    'REPORT_GENERATION',
    'PORTFOLIO_REBALANCING',
    'TAX_OPTIMIZATION'
  ],
  dependencies: [],
  configSchema: {
    type: 'object',
    properties: {
      tenantId: {
        type: 'string',
        description: 'Tenant identifier'
      },
      portfolioOptimizationEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable portfolio optimization functionality'
      },
      financialPlanningEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable financial planning functionality'
      },
      marketAnalysisEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable market analysis functionality'
      },
      riskManagementEnabled: {
        type: 'boolean',
        default: true,
        description: 'Enable risk management functionality'
      }
    },
    required: ['tenantId']
  },
  author: 'AURA Financial Services',
  license: 'MIT'
};