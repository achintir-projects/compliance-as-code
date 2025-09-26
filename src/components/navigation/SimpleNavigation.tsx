'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Database, 
  Zap, 
  Shield, 
  BarChart3, 
  Package, 
  BookOpen, 
  UserCheck, 
  User, 
  AlertTriangle, 
  Store, 
  Network, 
  Heart, 
  Lock, 
  Rocket, 
  Leaf, 
  Stethoscope,
  Brain
} from 'lucide-react';

interface SimpleNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" />, color: 'bg-blue-500' },
  { id: 'data-sources', label: 'Data Sources', icon: <Database className="h-4 w-4" />, color: 'bg-emerald-500' },
  { id: 'ingestion', label: 'Ingestion', icon: <Database className="h-4 w-4" />, color: 'bg-emerald-500' },
  { id: 'agents', label: 'Agents', icon: <Zap className="h-4 w-4" />, color: 'bg-purple-500' },
  { id: 'packages', label: 'Packages', icon: <Package className="h-4 w-4" />, color: 'bg-purple-500' },
  { id: 'workflows', label: 'Workflows', icon: <Zap className="h-4 w-4" />, color: 'bg-purple-500' },
  { id: 'knowledge', label: 'Knowledge', icon: <BookOpen className="h-4 w-4" />, color: 'bg-indigo-500' },
  { id: 'consent', label: 'Consent', icon: <UserCheck className="h-4 w-4" />, color: 'bg-rose-500' },
  { id: 'subject-rights', label: 'Subject Rights', icon: <User className="h-4 w-4" />, color: 'bg-rose-500' },
  { id: 'chaos-testing', label: 'Chaos Testing', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-red-500' },
  { id: 'marketplace', label: 'Marketplace', icon: <Store className="h-4 w-4" />, color: 'bg-amber-500' },
  { id: 'risk-exchange', label: 'Risk Exchange', icon: <Network className="h-4 w-4" />, color: 'bg-orange-500' },
  { id: 'incentivized-exchange', label: 'Incentivized', icon: <Network className="h-4 w-4" />, color: 'bg-orange-500' },
  { id: 'self-healing', label: 'Self-Healing', icon: <Shield className="h-4 w-4" />, color: 'bg-cyan-500' },
  { id: 'zk-compliance', label: 'ZK Compliance', icon: <Lock className="h-4 w-4" />, color: 'bg-cyan-500' },
  { id: 'compliance-assets', label: 'Asset Generator', icon: <Rocket className="h-4 w-4" />, color: 'bg-violet-500' },
  { id: 'health-tech', label: 'HealthTech', icon: <Stethoscope className="h-4 w-4" />, color: 'bg-violet-500' },
  { id: 'esg', label: 'ESG', icon: <Leaf className="h-4 w-4" />, color: 'bg-violet-500' },
  { id: 'enhanced-copilot', label: 'AI Copilot', icon: <Brain className="h-4 w-4" />, color: 'bg-indigo-500' },
  { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" />, color: 'bg-green-500' },
];

export function SimpleNavigation({ activeTab, onTabChange }: SimpleNavigationProps) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-3">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "outline"}
              className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 hover:shadow-md ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white border-slate-600' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <div className={`p-2 rounded-lg ${item.color} text-white`}>
                {item.icon}
              </div>
              <div className="text-center">
                <div className="text-xs font-medium leading-tight">
                  {item.label}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}