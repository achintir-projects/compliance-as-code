'use client';

import { useState } from 'react';
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
  ChevronDown,
  Settings,
  Brain,
  Globe,
  Scale,
  Building2,
  Activity,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'text-blue-600',
    description: 'Platform dashboard and metrics'
  },
  {
    id: 'data-plane',
    label: 'Data Plane',
    icon: <Database className="h-4 w-4" />,
    color: 'text-emerald-600',
    description: 'Data management and ingestion',
    children: [
      {
        id: 'data-sources',
        label: 'Data Sources',
        icon: <Database className="h-3 w-3" />,
        color: 'text-emerald-500',
        description: 'Manage data connections'
      },
      {
        id: 'ingestion',
        label: 'Ingestion',
        icon: <Activity className="h-3 w-3" />,
        color: 'text-emerald-500',
        description: 'Data ingestion pipelines'
      }
    ]
  },
  {
    id: 'agent-ecosystem',
    label: 'Agent Ecosystem',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-purple-600',
    description: 'AI agents and workflows',
    children: [
      {
        id: 'agents',
        label: 'Agents',
        icon: <Zap className="h-3 w-3" />,
        color: 'text-purple-500',
        description: 'Execute AI agents'
      },
      {
        id: 'packages',
        label: 'Packages',
        icon: <Package className="h-3 w-3" />,
        color: 'text-purple-500',
        description: 'Agent packages'
      },
      {
        id: 'workflows',
        label: 'Workflows',
        icon: <Settings className="h-3 w-3" />,
        color: 'text-purple-500',
        description: 'Workflow management'
      }
    ]
  },
  {
    id: 'compliance-intelligence',
    label: 'Compliance Intelligence',
    icon: <Brain className="h-4 w-4" />,
    color: 'text-indigo-600',
    description: 'AI-powered compliance',
    children: [
      {
        id: 'knowledge',
        label: 'Knowledge Base',
        icon: <BookOpen className="h-3 w-3" />,
        color: 'text-indigo-500',
        description: 'Compliance knowledge'
      },
      {
        id: 'enhanced-copilot',
        label: 'AI Copilot',
        icon: <Brain className="h-3 w-3" />,
        color: 'text-indigo-500',
        description: 'Compliance assistant'
      }
    ]
  },
  {
    id: 'privacy-management',
    label: 'Privacy Management',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-rose-600',
    description: 'Privacy and consent',
    children: [
      {
        id: 'consent',
        label: 'Consent',
        icon: <UserCheck className="h-3 w-3" />,
        color: 'text-rose-500',
        description: 'Consent management'
      },
      {
        id: 'subject-rights',
        label: 'Subject Rights',
        icon: <User className="h-3 w-3" />,
        color: 'text-rose-500',
        description: 'Data subject rights'
      }
    ]
  },
  {
    id: 'risk-exchange',
    label: 'Risk Exchange',
    icon: <Network className="h-4 w-4" />,
    color: 'text-orange-600',
    description: 'Risk sharing network',
    children: [
      {
        id: 'risk-exchange',
        label: 'Federated Exchange',
        icon: <Network className="h-3 w-3" />,
        color: 'text-orange-500',
        description: 'Federated risk sharing'
      },
      {
        id: 'incentivized-exchange',
        label: 'Incentivized Exchange',
        icon: <Scale className="h-3 w-3" />,
        color: 'text-orange-500',
        description: 'Economic incentives'
      }
    ]
  },
  {
    id: 'advanced-compliance',
    label: 'Advanced Compliance',
    icon: <Rocket className="h-4 w-4" />,
    color: 'text-cyan-600',
    description: 'Next-gen compliance',
    children: [
      {
        id: 'self-healing',
        label: 'Self-Healing',
        icon: <ShieldCheck className="h-3 w-3" />,
        color: 'text-cyan-500',
        description: 'Auto-compliance'
      },
      {
        id: 'zk-compliance',
        label: 'ZK Compliance',
        icon: <Lock className="h-3 w-3" />,
        color: 'text-cyan-500',
        description: 'Zero-knowledge proofs'
      },
      {
        id: 'compliance-assets',
        label: 'Asset Generator',
        icon: <Rocket className="h-3 w-3" />,
        color: 'text-cyan-500',
        description: 'Generate microservices'
      }
    ]
  },
  {
    id: 'industry-solutions',
    label: 'Industry Solutions',
    icon: <Building2 className="h-4 w-4" />,
    color: 'text-violet-600',
    description: 'Industry-specific compliance',
    children: [
      {
        id: 'health-tech',
        label: 'HealthTech',
        icon: <Stethoscope className="h-3 w-3" />,
        color: 'text-violet-500',
        description: 'Healthcare compliance'
      },
      {
        id: 'esg',
        label: 'ESG',
        icon: <Leaf className="h-3 w-3" />,
        color: 'text-violet-500',
        description: 'Environmental compliance'
      }
    ]
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: <Store className="h-4 w-4" />,
    color: 'text-amber-600',
    description: 'Regulatory DSL marketplace'
  },
  {
    id: 'chaos-testing',
    label: 'Chaos Testing',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-600',
    description: 'Resilience testing'
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-green-600',
    description: 'Security management'
  }
];

interface ElegantNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ElegantNavigation({ activeTab, onTabChange }: ElegantNavigationProps) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleMenuClick = (itemId: string) => {
    const item = navigationItems.find(nav => nav.id === itemId);
    if (item && item.children) {
      setExpandedMenu(expandedMenu === itemId ? null : itemId);
    } else {
      onTabChange(itemId);
      setExpandedMenu(null);
    }
  };

  const handleChildClick = (childId: string) => {
    onTabChange(childId);
    setExpandedMenu(null);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {navigationItems.map((item) => (
            <div key={item.id} className="relative">
              <Button
                variant={activeTab === item.id ? "default" : "outline"}
                className={`w-full h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 hover:shadow-md ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white border-slate-600' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => handleMenuClick(item.id)}
              >
                <div className={item.color}>
                  {item.icon}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium leading-tight">
                    {item.label}
                  </div>
                  {item.children && (
                    <ChevronDown 
                      className={`h-3 w-3 mx-auto mt-1 transition-transform duration-200 ${
                        expandedMenu === item.id ? 'rotate-180' : ''
                      }`} 
                    />
                  )}
                </div>
              </Button>
              
              {item.children && expandedMenu === item.id && (
                <Card className="absolute top-full left-0 right-0 z-50 mt-2 shadow-xl border-slate-200">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {item.children.map((child) => (
                        <Button
                          key={child.id}
                          variant="ghost"
                          className={`w-full justify-start h-auto p-3 space-x-3 ${
                            activeTab === child.id 
                              ? 'bg-slate-100 text-slate-900' 
                              : 'hover:bg-slate-50'
                          }`}
                          onClick={() => handleChildClick(child.id)}
                        >
                          <div className={child.color}>
                            {child.icon}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium">
                              {child.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {child.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}