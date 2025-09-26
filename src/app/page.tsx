'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ElegantNavigation } from '@/components/navigation/ElegantNavigation';

// Import all module components
import { KnowledgeManager } from '@/components/knowledge/KnowledgeManager';
import { EnhancedComplianceCopilot } from '@/components/compliance-copilot/EnhancedComplianceCopilot';
import { ConsentManager } from '@/components/consent/ConsentManager';
import { SubjectRightsManager } from '@/components/subject-rights/SubjectRightsManager';
import { EnhancedFederatedRiskExchange } from '@/components/risk-exchange/EnhancedFederatedRiskExchange';
import { FederatedRiskExchange } from '@/components/risk-exchange/FederatedRiskExchange';
import { IncentivizedRiskExchange } from '@/components/risk-exchange/IncentivizedRiskExchange';
import { SelfHealingCompliance } from '@/components/self-healing/SelfHealingCompliance';
import { ZeroKnowledgeCompliance } from '@/components/zk-compliance/ZeroKnowledgeCompliance';
import { ComplianceAssetManager } from '@/components/compliance-assets/ComplianceAssetManager';
import { ComplianceAssetGenerator } from '@/components/compliance-assets/ComplianceAssetGenerator';
import { HealthTechComplianceManager } from '@/components/health-tech/HealthTechComplianceManager';
import { ESGComplianceManager } from '@/components/esg/ESGComplianceManager';
import { RegulatoryDSLMarketplace } from '@/components/marketplace/RegulatoryDSLMarketplace';
import { ChaosTestingManager } from '@/components/chaos/ChaosTestingManager';
import { SecurityManager } from '@/components/security/SecurityManager';
import { DataSourceManager } from '@/components/data-plane/DataSourceManager';
import { IngestionManager } from '@/components/data-plane/IngestionManager';
import { AgentExecutionPanel } from '@/components/agents/AgentExecutionPanel';
import { AgentPackageManager } from '@/components/agent-packages/AgentPackageManager';
import { WorkflowManager } from '@/components/workflows/WorkflowManager';
import { FraudMutationManager } from '@/components/fraud/FraudMutationManager';

// Component mapping for navigation items
const componentMap: Record<string, React.ComponentType> = {
  'overview': () => null, // Handled separately in the main render
  
  // Data Plane Management
  'data-sources': DataSourceManager,
  'ingestion': IngestionManager,
  
  // Agent Ecosystem
  'agents': AgentExecutionPanel,
  'packages': AgentPackageManager,
  'workflows': WorkflowManager,
  
  // Compliance Intelligence
  'knowledge': KnowledgeManager,
  'enhanced-copilot': EnhancedComplianceCopilot,
  
  // Privacy Management
  'consent': ConsentManager,
  'subject-rights': SubjectRightsManager,
  
  // Risk Exchange
  'risk-exchange': FederatedRiskExchange,
  'federated-exchange': EnhancedFederatedRiskExchange,
  'incentivized-exchange': IncentivizedRiskExchange,
  
  // Advanced Compliance
  'self-healing': SelfHealingCompliance,
  'zk-compliance': ZeroKnowledgeCompliance,
  'compliance-assets': ComplianceAssetManager,
  'asset-generator': ComplianceAssetGenerator,
  
  // Industry Solutions
  'health-tech': HealthTechComplianceManager,
  'esg': ESGComplianceManager,
  
  // Other Modules
  'marketplace': RegulatoryDSLMarketplace,
  'chaos-testing': ChaosTestingManager,
  'security': SecurityManager,
  'fraud': FraudMutationManager,
};
import { 
  CheckCircle, 
  Activity, 
  Database, 
  Shield, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Clock,
  Zap,
  Brain,
  Network,
  Rocket,
  Building2,
  Store,
  BarChart3,
  BookOpen,
  UserCheck,
  Lock,
  Scale,
  Stethoscope,
  Leaf,
  Globe,
  Settings,
  FileText,
  Heart,
  ChevronRight
} from 'lucide-react';

interface SystemStats {
  totalKnowledgeObjects: number;
  deployedRules: number;
  pendingReviews: number;
  activeAgents: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  zkProofsGenerated: number;
  riskExchangeNodes: number;
  selfHealingEvents: number;
}

interface ModuleStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  metrics: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<SystemStats>({
    totalKnowledgeObjects: 0,
    deployedRules: 0,
    pendingReviews: 0,
    activeAgents: 0,
    systemHealth: 'healthy',
    zkProofsGenerated: 0,
    riskExchangeNodes: 0,
    selfHealingEvents: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  const moduleStatuses: ModuleStatus[] = [
    {
      id: 'data-plane',
      name: 'Data Plane Management',
      status: 'active',
      description: 'Data sources and ingestion pipelines',
      metrics: [
        { label: 'Data Sources', value: '12', trend: 'up' },
        { label: 'Ingestion Rate', value: '1.2K/sec', trend: 'stable' },
        { label: 'Data Quality', value: '99.8%', trend: 'up' }
      ]
    },
    {
      id: 'agent-ecosystem',
      name: 'Agent Ecosystem',
      status: 'active',
      description: 'AI agents and execution framework',
      metrics: [
        { label: 'Active Agents', value: '24', trend: 'up' },
        { label: 'Executions/min', value: '847', trend: 'up' },
        { label: 'Success Rate', value: '99.2%', trend: 'stable' }
      ]
    },
    {
      id: 'compliance-intelligence',
      name: 'Compliance Intelligence',
      status: 'active',
      description: 'AI-powered compliance analysis',
      metrics: [
        { label: 'Knowledge Objects', value: '1,247', trend: 'up' },
        { label: 'AI Insights', value: '342', trend: 'up' },
        { label: 'Accuracy', value: '96.5%', trend: 'up' }
      ]
    },
    {
      id: 'privacy-management',
      name: 'Privacy Management',
      status: 'active',
      description: 'Consent and subject rights',
      metrics: [
        { label: 'Consent Objects', value: '8,934', trend: 'up' },
        { label: 'Subject Requests', value: '127', trend: 'stable' },
        { label: 'Processing Time', value: '<2h', trend: 'stable' }
      ]
    },
    {
      id: 'risk-exchange',
      name: 'Risk Exchange',
      status: 'active',
      description: 'Federated risk intelligence sharing',
      metrics: [
        { label: 'Network Nodes', value: '47', trend: 'up' },
        { label: 'Risk Signals', value: '12.4K', trend: 'up' },
        { label: 'Contributions', value: '892', trend: 'up' }
      ]
    },
    {
      id: 'advanced-compliance',
      name: 'Advanced Compliance',
      status: 'active',
      description: 'Next-generation compliance technologies',
      metrics: [
        { label: 'ZK Proofs', value: '3,247', trend: 'up' },
        { label: 'Self-Healing', value: '156', trend: 'up' },
        { label: 'Assets Generated', value: '89', trend: 'up' }
      ]
    },
    {
      id: 'industry-solutions',
      name: 'Industry Solutions',
      status: 'active',
      description: 'Industry-specific compliance frameworks',
      metrics: [
        { label: 'HealthTech', value: 'Active', trend: 'stable' },
        { label: 'ESG', value: 'Active', trend: 'stable' },
        { label: 'Frameworks', value: '24', trend: 'up' }
      ]
    },
    {
      id: 'marketplace',
      name: 'Regulatory DSL Marketplace',
      status: 'active',
      description: 'Direct regulator publishing platform',
      metrics: [
        { label: 'Active Listings', value: '342', trend: 'up' },
        { label: 'Regulators', value: '18', trend: 'up' },
        { label: 'Downloads', value: '12.4K', trend: 'up' }
      ]
    },
    {
      id: 'chaos-testing',
      name: 'Chaos Testing',
      status: 'active',
      description: 'Resilience and adversarial testing',
      metrics: [
        { label: 'Test Scenarios', value: '89', trend: 'up' },
        { label: 'Resilience Score', value: '94.2%', trend: 'up' },
        { label: 'Last Test', value: '2h ago', trend: 'stable' }
      ]
    },
    {
      id: 'security',
      name: 'Security Management',
      status: 'active',
      description: 'Comprehensive security controls',
      metrics: [
        { label: 'Security Score', value: '98.5%', trend: 'stable' },
        { label: 'Threats Blocked', value: '1,247', trend: 'up' },
        { label: 'Audit Events', value: '45.2K', trend: 'up' }
      ]
    }
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'error': return <AlertTriangle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'maintenance': return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      case 'stable': return <div className="h-3 w-3 bg-blue-600 rounded-full" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded transform rotate-45"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GlassBox AI - ENHANCED VERSION
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  The Global Operating System for Regulatory Technology
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full animate-pulse ${stats.systemHealth === 'healthy' ? 'bg-green-500' : stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-slate-600">System {stats.systemHealth}</span>
              </div>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                v2.0.0
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <ElegantNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Global Operating System Status */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span>Global Operating System Status</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Real-time metrics across the global regulatory technology landscape
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{isLoading ? '...' : stats.totalKnowledgeObjects}</div>
                    <div className="text-sm text-slate-600">Knowledge Objects</div>
                    <div className="text-xs text-green-600">Global Intelligence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{isLoading ? '...' : stats.deployedRules}</div>
                    <div className="text-sm text-slate-600">Deployed Rules</div>
                    <div className="text-xs text-green-600">Production Ready</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{isLoading ? '...' : stats.activeAgents}</div>
                    <div className="text-sm text-slate-600">Active Agents</div>
                    <div className="text-xs text-purple-600">AI Operations</div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getHealthColor(stats.systemHealth)}`}>
                      {getHealthIcon(stats.systemHealth)}
                      <span className="font-medium capitalize">{stats.systemHealth}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">System Health</div>
                    <div className="text-xs text-green-600">Enterprise Grade</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Technology Stack */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center space-x-2">
                  <Rocket className="h-5 w-5 text-purple-600" />
                  <span>Advanced Technology Stack</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Cutting-edge technologies powering the global regulatory operating system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Lock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Zero-Knowledge Proofs</div>
                        <div className="text-sm text-slate-600">Privacy-preserving compliance verification</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">{stats.zkProofsGenerated}</div>
                      <div className="text-xs text-slate-500">proofs generated</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Network className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Federated Risk Exchange</div>
                        <div className="text-sm text-slate-600">Privacy-preserving intelligence sharing</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{stats.riskExchangeNodes}</div>
                      <div className="text-xs text-slate-500">network nodes</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <Shield className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Self-Healing Compliance</div>
                        <div className="text-sm text-slate-600">Automated recovery and alerting</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-cyan-600">{stats.selfHealingEvents}</div>
                      <div className="text-xs text-slate-500">events resolved</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Status Overview */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span>Module Status Overview</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Real-time status and performance metrics across all system modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {moduleStatuses.map((module) => (
                    <div key={module.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(module.status)}
                          <h3 className="font-medium text-slate-800">{module.name}</h3>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{module.description}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {module.metrics.map((metric, index) => (
                          <div key={index} className="text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="text-sm font-medium text-slate-800">{metric.value}</span>
                              {getTrendIcon(metric.trend)}
                            </div>
                            <div className="text-xs text-slate-500">{metric.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Global Operating System Active</CardTitle>
                <CardDescription className="text-blue-100">
                  GlassBox AI ENHANCED VERSION is operational across the global regulatory landscape
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-blue-100 mb-6">
                  The world's premier regulatory technology operating system is actively managing compliance 
                  across 10 major modules with enterprise-grade performance and global reach.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Activity className="h-4 w-4 mr-2" />
                    View System Metrics
                  </Button>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Modules
                  </Button>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                </div>
                <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full mt-6">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">All Systems Operational</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Render actual module components */}
        {activeTab !== 'overview' && (
          <div className="space-y-6">
            {componentMap[activeTab] ? (
              <>
                {/* Module Header */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-800 capitalize">
                      {activeTab.replace('-', ' ')} Module
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Advanced {activeTab.replace('-', ' ')} capabilities and management interface
                    </CardDescription>
                  </CardHeader>
                </Card>
                {/* Module Component */}
                {React.createElement(componentMap[activeTab])}
              </>
            ) : (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 capitalize">
                    {activeTab.replace('-', ' ')} Module
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Advanced {activeTab.replace('-', ' ')} capabilities and management interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Module Interface</h3>
                    <p className="text-slate-600 mb-6">
                      This module contains advanced features and management tools for {activeTab.replace('-', ' ')}.
                      The full interface would be displayed here with comprehensive functionality.
                    </p>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      Launch Module Interface
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}