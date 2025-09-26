'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Activity,
  Clock,
  Zap,
  Settings,
  TrendingUp,
  AlertCircle,
  Heart,
  Wrench,
  Database,
  Network,
  Lock,
  FileText
} from 'lucide-react';

interface HealingEvent {
  id: string;
  type: 'AUTO_REVERT' | 'ALERT' | 'MANUAL_INTERVENTION' | 'PREVENTIVE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  component: string;
  description: string;
  action: string;
  timestamp: string;
  status: 'RESOLVED' | 'IN_PROGRESS' | 'PENDING' | 'FAILED';
  impact: string;
  resolutionTime?: string;
}

interface SystemHealth {
  component: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
  uptime: number;
  lastCheck: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
}

interface HealingRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: number;
  lastTriggered?: string;
  successRate: number;
}

interface ComplianceSnapshot {
  id: string;
  timestamp: string;
  score: number;
  issues: number;
  criticalIssues: number;
  components: {
    dataPlane: number;
    agentRuntime: number;
    complianceEngine: number;
    knowledgeBase: number;
    securityLayer: number;
  };
}

export function SelfHealingCompliance() {
  const [healingEvents, setHealingEvents] = useState<HealingEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [healingRules, setHealingRules] = useState<HealingRule[]>([]);
  const [snapshots, setSnapshots] = useState<ComplianceSnapshot[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHealingEvents();
    fetchSystemHealth();
    fetchHealingRules();
    fetchSnapshots();
  }, []);

  const fetchHealingEvents = async () => {
    try {
      const response = await fetch('/api/self-healing/events');
      if (response.ok) {
        const data = await response.json();
        setHealingEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching healing events:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/self-healing/health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data.health);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const fetchHealingRules = async () => {
    try {
      const response = await fetch('/api/self-healing/rules');
      if (response.ok) {
        const data = await response.json();
        setHealingRules(data.rules);
      }
    } catch (error) {
      console.error('Error fetching healing rules:', error);
    }
  };

  const fetchSnapshots = async () => {
    try {
      const response = await fetch('/api/self-healing/snapshots');
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots);
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    }
  };

  const triggerHealing = async (eventId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/self-healing/events/${eventId}/trigger`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchHealingEvents();
        await fetchSystemHealth();
      }
    } catch (error) {
      console.error('Error triggering healing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/self-healing/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await fetchHealingRules();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const createSnapshot = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/self-healing/snapshots', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchSnapshots();
      }
    } catch (error) {
      console.error('Error creating snapshot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600';
      case 'DEGRADED': return 'text-yellow-600';
      case 'CRITICAL': return 'text-red-600';
      case 'OFFLINE': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <Badge className="bg-green-600">Healthy</Badge>;
      case 'DEGRADED': return <Badge className="bg-yellow-600">Degraded</Badge>;
      case 'CRITICAL': return <Badge className="bg-red-600">Critical</Badge>;
      case 'OFFLINE': return <Badge className="bg-gray-600">Offline</Badge>;
      default: return <Badge className="bg-gray-600">Unknown</Badge>;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'AUTO_REVERT': return <RefreshCw className="w-5 h-5 text-blue-600" />;
      case 'ALERT': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'MANUAL_INTERVENTION': return <Wrench className="w-5 h-5 text-orange-600" />;
      case 'PREVENTIVE': return <Shield className="w-5 h-5 text-green-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'Data Plane': return <Database className="w-5 h-5" />;
      case 'Agent Runtime': return <Zap className="w-5 h-5" />;
      case 'Compliance Engine': return <FileText className="w-5 h-5" />;
      case 'Knowledge Base': return <TrendingUp className="w-5 h-5" />;
      case 'Security Layer': return <Lock className="w-5 h-5" />;
      case 'Network': return <Network className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getHealthStatus = (health: SystemHealth[]) => {
    const critical = health.filter(h => h.status === 'CRITICAL').length;
    const degraded = health.filter(h => h.status === 'DEGRADED').length;
    const healthy = health.filter(h => h.status === 'HEALTHY').length;
    
    if (critical > 0) return 'CRITICAL';
    if (degraded > 0) return 'DEGRADED';
    if (healthy === health.length) return 'HEALTHY';
    return 'UNKNOWN';
  };

  const overallHealth = getHealthStatus(systemHealth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Self-Healing Compliance System</h1>
          <p className="text-muted-foreground">
            Automated compliance recovery and real-time alerting system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createSnapshot} disabled={isLoading}>
            <Database className="w-4 h-4 mr-2" />
            Create Snapshot
          </Button>
          <Button variant="outline" onClick={() => { fetchHealingEvents(); fetchSystemHealth(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Heart className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(overallHealth)}`}>
              {overallHealth}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.filter(h => h.status === 'HEALTHY').length} of {systemHealth.length} components healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healingEvents.filter(e => e.status === 'IN_PROGRESS' || e.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">Healing events active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healingEvents.length > 0 ? Math.round((healingEvents.filter(e => e.status === 'RESOLVED').length / healingEvents.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Auto-healing success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3m</div>
            <p className="text-xs text-muted-foreground">Minutes to resolve</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="events">Healing Events</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="rules">Healing Rules</TabsTrigger>
          <TabsTrigger value="snapshots">Compliance Snapshots</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Healing Events
                </CardTitle>
                <CardDescription>
                  Latest auto-recovery and alerting activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {healingEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex-shrink-0">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{event.component}</span>
                            <Badge variant={event.severity === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-xs">
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  System Health Overview
                </CardTitle>
                <CardDescription>
                  Real-time health status of all components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemHealth.map((health) => (
                    <div key={health.component} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {getComponentIcon(health.component)}
                        <div>
                          <div className="font-medium text-sm">{health.component}</div>
                          <div className="text-xs text-muted-foreground">
                            Uptime: {health.uptime.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            CPU: {health.metrics.cpu}% | Memory: {health.metrics.memory}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Response: {health.metrics.responseTime}ms
                          </div>
                        </div>
                        {getStatusBadge(health.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Compliance Trend
              </CardTitle>
              <CardDescription>
                Historical compliance scores and system stability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {snapshots.slice(-5).map((snapshot) => (
                  <div key={snapshot.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {new Date(snapshot.timestamp).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Issues: {snapshot.issues} (Critical: {snapshot.criticalIssues})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium">{snapshot.score}%</div>
                        <div className="text-xs text-muted-foreground">Compliance Score</div>
                      </div>
                      <div className="w-16">
                        <Progress value={snapshot.score} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Healing Events History
              </CardTitle>
              <CardDescription>
                Complete log of all auto-healing and alerting events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {healingEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getEventIcon(event.type)}
                          <div>
                            <div className="font-medium">{event.component}</div>
                            <div className="text-sm text-muted-foreground">{event.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={event.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                            {event.severity}
                          </Badge>
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-medium">Description</div>
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium">Action Taken</div>
                          <div className="text-sm text-muted-foreground">{event.action}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium">Impact</div>
                          <div className="text-sm text-muted-foreground">{event.impact}</div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Started: {new Date(event.timestamp).toLocaleString()}</span>
                          {event.resolutionTime && (
                            <span>Resolved: {new Date(event.resolutionTime).toLocaleString()}</span>
                          )}
                        </div>
                        
                        {event.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => triggerHealing(event.id)}
                              disabled={isLoading}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Trigger Healing
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {systemHealth.map((health) => (
              <Card key={health.component}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getComponentIcon(health.component)}
                    {health.component}
                  </CardTitle>
                  <CardDescription>
                    Last checked: {new Date(health.lastCheck).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    {getStatusBadge(health.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uptime</span>
                      <span className="font-medium">{health.uptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={health.uptime} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>CPU Usage</span>
                      <span className="font-medium">{health.metrics.cpu}%</span>
                    </div>
                    <Progress value={health.metrics.cpu} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Memory Usage</span>
                      <span className="font-medium">{health.metrics.memory}%</span>
                    </div>
                    <Progress value={health.metrics.memory} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Disk Usage</span>
                      <span className="font-medium">{health.metrics.disk}%</span>
                    </div>
                    <Progress value={health.metrics.disk} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Response Time</span>
                    <span className="font-medium">{health.metrics.responseTime}ms</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Healing Rules Configuration
              </CardTitle>
              <CardDescription>
                Configure automated healing rules and triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healingRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                        <Button
                          size="sm"
                          variant={rule.enabled ? "default" : "outline"}
                          onClick={() => toggleRule(rule.id, !rule.enabled)}
                        >
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Condition:</span>
                        <span className="text-muted-foreground ml-2">{rule.condition}</span>
                      </div>
                      <div>
                        <span className="font-medium">Action:</span>
                        <span className="text-muted-foreground ml-2">{rule.action}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Success Rate: {rule.successRate.toFixed(1)}%</span>
                        {rule.lastTriggered && (
                          <span>Last Triggered: {new Date(rule.lastTriggered).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Compliance Snapshots
              </CardTitle>
              <CardDescription>
                Historical compliance snapshots and system state backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">
                            {new Date(snapshot.timestamp).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Snapshot ID: {snapshot.id}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{snapshot.score}%</div>
                          <div className="text-sm text-muted-foreground">Compliance Score</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">Data Plane</div>
                          <div className="text-lg font-bold">{snapshot.components.dataPlane}%</div>
                          <Progress value={snapshot.components.dataPlane} className="h-2 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Agent Runtime</div>
                          <div className="text-lg font-bold">{snapshot.components.agentRuntime}%</div>
                          <Progress value={snapshot.components.agentRuntime} className="h-2 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Compliance Engine</div>
                          <div className="text-lg font-bold">{snapshot.components.complianceEngine}%</div>
                          <Progress value={snapshot.components.complianceEngine} className="h-2 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Knowledge Base</div>
                          <div className="text-lg font-bold">{snapshot.components.knowledgeBase}%</div>
                          <Progress value={snapshot.components.knowledgeBase} className="h-2 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Security Layer</div>
                          <div className="text-lg font-bold">{snapshot.components.securityLayer}%</div>
                          <Progress value={snapshot.components.securityLayer} className="h-2 mt-1" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span>Issues: {snapshot.issues}</span>
                          <span className="text-red-600">Critical: {snapshot.criticalIssues}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Restore to this Snapshot
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}