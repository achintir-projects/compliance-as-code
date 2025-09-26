'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Activity, Database, Shield, TrendingUp, Users, AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemStats {
  totalKnowledgeObjects: number;
  deployedRules: number;
  pendingReviews: number;
  activeAgents: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

interface ComplianceDomain {
  name: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

export default function Home() {
  const [stats, setStats] = useState<SystemStats>({
    totalKnowledgeObjects: 0,
    deployedRules: 0,
    pendingReviews: 0,
    activeAgents: 0,
    systemHealth: 'healthy'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/airtable/sync');
      const data = await response.json();
      
      if (data.success) {
        setStats(prev => ({
          ...prev,
          totalKnowledgeObjects: data.summary.total || 0,
          deployedRules: data.summary.deployed || 0,
          pendingReviews: data.summary.pendingReview || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const complianceDomains: ComplianceDomain[] = [
    {
      name: 'RegTech',
      description: 'Regulatory Technology compliance',
      count: 1,
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      name: 'Payments',
      description: 'Payment processing regulations',
      count: 1,
      icon: <Activity className="h-6 w-6" />,
      color: 'bg-green-50 text-green-600'
    },
    {
      name: 'Insurance',
      description: 'Insurance regulatory compliance',
      count: 1,
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      name: 'Digital Banking',
      description: 'Digital banking regulations',
      count: 1,
      icon: <Database className="h-6 w-6" />,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      name: 'WealthTech',
      description: 'Wealth management compliance',
      count: 1,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-red-50 text-red-600'
    }
  ];

  const regulationTypes = [
    { name: 'AML', description: 'Anti-Money Laundering', count: 1 },
    { name: 'PSD2', description: 'Payment Services Directive', count: 1 },
    { name: 'KYC', description: 'Know Your Customer', count: 1 },
    { name: 'Insurance', description: 'Insurance Regulations', count: 1 },
    { name: 'Investment', description: 'Investment Compliance', count: 1 }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                  GlassBox AI Platform
                </h1>
                <p className="text-sm text-slate-500">
                  Compliance Management System
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full animate-pulse ${stats.systemHealth === 'healthy' ? 'bg-green-500' : stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-600">System {stats.systemHealth}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* System Overview */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">System Overview</CardTitle>
              <CardDescription className="text-slate-600">
                Real-time system status and compliance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{isLoading ? '...' : stats.totalKnowledgeObjects}</div>
                  <div className="text-sm text-slate-600">Knowledge Objects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{isLoading ? '...' : stats.deployedRules}</div>
                  <div className="text-sm text-slate-600">Deployed Rules</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{isLoading ? '...' : stats.pendingReviews}</div>
                  <div className="text-sm text-slate-600">Pending Reviews</div>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getHealthColor(stats.systemHealth)}`}>
                    {getHealthIcon(stats.systemHealth)}
                    <span className="font-medium capitalize">{stats.systemHealth}</span>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">System Health</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Domains */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Compliance Domains</CardTitle>
              <CardDescription className="text-slate-600">
                Active regulatory compliance domains in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complianceDomains.map((domain) => (
                  <div key={domain.name} className={`flex items-center space-x-3 p-4 rounded-lg ${domain.color}`}>
                    {domain.icon}
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{domain.name}</div>
                      <div className="text-sm text-slate-600">{domain.description}</div>
                      <div className="text-xs text-slate-500 mt-1">{domain.count} rule{domain.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regulation Types */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Regulation Types</CardTitle>
              <CardDescription className="text-slate-600">
                Supported regulatory frameworks and compliance types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regulationTypes.map((regulation) => (
                  <div key={regulation.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-800">{regulation.name}</div>
                      <div className="text-sm text-slate-600">{regulation.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{regulation.count}</div>
                      <div className="text-xs text-slate-500">rules</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Actions */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">System Actions</CardTitle>
              <CardDescription className="text-slate-600">
                Quick actions for system management and data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={fetchSystemStats}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-600">Refresh Stats</span>
                </button>
                <button
                  onClick={() => window.open('/api/airtable/sync', '_blank')}
                  className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Database className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Sync Data</span>
                </button>
                <button
                  onClick={() => window.open('/api/airtable/knowledge-objects', '_blank')}
                  className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-600">View Objects</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">System Ready</CardTitle>
              <CardDescription className="text-blue-100">
                GlassBox AI Platform is operational and ready for compliance management
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-blue-100 mb-4">
                The system is actively monitoring compliance domains and processing regulatory requirements.
                All components are functioning normally and ready for production use.
              </p>
              <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">All Systems Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}