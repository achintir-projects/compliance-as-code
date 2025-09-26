'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Activity, Database, Shield, TrendingUp, Users, AlertTriangle, Clock, Globe, Rocket } from 'lucide-react';

interface SystemStats {
  totalKnowledgeObjects: number;
  deployedRules: number;
  pendingReviews: number;
  activeAgents: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<SystemStats>({
    totalKnowledgeObjects: 1247,
    deployedRules: 89,
    pendingReviews: 12,
    activeAgents: 24,
    systemHealth: 'healthy'
  });

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
        <nav className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {['overview', 'knowledge', 'data-sources', 'agents', 'security', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`p-4 rounded-lg border transition-all ${
                activeTab === tab
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="text-sm font-medium capitalize">{tab.replace('-', ' ')}</div>
            </button>
          ))}
        </nav>
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
                    <div className="text-3xl font-bold text-blue-600">{stats.totalKnowledgeObjects}</div>
                    <div className="text-sm text-slate-600">Knowledge Objects</div>
                    <div className="text-xs text-green-600">Global Intelligence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.deployedRules}</div>
                    <div className="text-sm text-slate-600">Deployed Rules</div>
                    <div className="text-xs text-green-600">Production Ready</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.activeAgents}</div>
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

            {/* System Information */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center space-x-2">
                  <Rocket className="h-5 w-5 text-purple-600" />
                  <span>System Information</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  GlassBox AI is now fully configured for iframe embedding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">✅ Iframe Support</h4>
                      <p className="text-sm text-green-600">Application can be embedded in iframes</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800">✅ Firefox Compatible</h4>
                      <p className="text-sm text-blue-600">Works in Firefox iframe environments</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800">✅ Security Headers</h4>
                      <p className="text-sm text-purple-600">CSP and X-Frame-Options configured</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-800">✅ CORS Enabled</h4>
                      <p className="text-sm text-yellow-600">Cross-origin requests supported</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== 'overview' && (
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
              </CardTitle>
              <CardDescription className="text-slate-600">
                Module under development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">Under Development</h3>
                <p className="text-slate-600">This module is currently being built and will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}