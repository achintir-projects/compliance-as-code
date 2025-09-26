'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { 
  ChaosTestCategory, 
  ChaosSeverity, 
  ChaosExecutionStatus 
} from '@prisma/client';

interface ChaosTestScenario {
  id: string;
  name: string;
  description: string;
  category: ChaosTestCategory;
  targetSystem: string;
  failureMode: string;
  severity: ChaosSeverity;
  isActive: boolean;
  createdAt: string;
}

interface ChaosTestExecution {
  id: string;
  scenarioId: string;
  status: ChaosExecutionStatus;
  startTime: string;
  endTime?: string;
  recoveryTime?: number;
  autoRecovered: boolean;
  scenario: ChaosTestScenario;
  reports?: ChaosTestReport[];
}

interface ChaosTestReport {
  id: string;
  reportType: string;
  resilienceScore: number;
  summary: any;
  findings: string[];
  recommendations: string[];
}

interface ResilienceDashboard {
  totalTests: number;
  passRate: number;
  averageRecoveryTime: number;
  averageResilienceScore: number;
  categoryStats: Record<string, { count: number; avgScore: number }>;
  recentExecutions: ChaosTestExecution[];
}

export function ChaosTestingManager() {
  const [scenarios, setScenarios] = useState<ChaosTestScenario[]>([]);
  const [history, setHistory] = useState<ChaosTestExecution[]>([]);
  const [dashboard, setDashboard] = useState<ResilienceDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scenariosRes, historyRes, dashboardRes] = await Promise.all([
        fetch('/api/chaos/scenarios'),
        fetch('/api/chaos/history'),
        fetch('/api/chaos/dashboard')
      ]);

      const scenariosData = await scenariosRes.json();
      const historyData = await historyRes.json();
      const dashboardData = await dashboardRes.json();

      setScenarios(scenariosData.scenarios || []);
      setHistory(historyData.history || []);
      setDashboard(dashboardData.dashboard || null);
    } catch (error) {
      console.error('Error loading chaos testing data:', error);
    }
  };

  const executeScenario = async (scenarioId: string) => {
    setLoading(true);
    setExecutionStatus('Executing chaos test...');
    
    try {
      const response = await fetch('/api/chaos/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });

      if (response.ok) {
        setExecutionStatus('Chaos test completed successfully!');
        await loadData(); // Refresh data
      } else {
        const error = await response.json();
        setExecutionStatus(`Error: ${error.error}`);
      }
    } catch (error) {
      setExecutionStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setExecutionStatus(null), 5000);
    }
  };

  const createDefaultScenarios = async () => {
    const defaultScenarios = [
      {
        name: 'Stale Knowledge Base Sync',
        description: 'Simulates knowledge base synchronization failures',
        category: 'KNOWLEDGE_BASE_SYNC',
        targetSystem: 'knowledge-base',
        failureMode: 'sync-timeout',
        severity: 'MEDIUM',
        config: { duration: 5000 }
      },
      {
        name: 'DSL Bundle Corruption',
        description: 'Simulates corrupted DSL bundle files',
        category: 'DSL_BUNDLE_CORRUPTION',
        targetSystem: 'dsl-runtime',
        failureMode: 'bundle-corruption',
        severity: 'HIGH',
        config: { duration: 3000 }
      },
      {
        name: 'Kafka Partition Drop',
        description: 'Simulates dropped Kafka partitions',
        category: 'MESSAGING_FAILURE',
        targetSystem: 'messaging',
        failureMode: 'partition-loss',
        severity: 'MEDIUM',
        config: { duration: 4000 }
      }
    ];

    for (const scenario of defaultScenarios) {
      try {
        await fetch('/api/chaos/scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scenario)
        });
      } catch (error) {
        console.error('Error creating default scenario:', error);
      }
    }

    await loadData();
  };

  const getStatusColor = (status: ChaosExecutionStatus) => {
    switch (status) {
      case ChaosExecutionStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ChaosExecutionStatus.RUNNING:
        return 'bg-blue-100 text-blue-800';
      case ChaosExecutionStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case ChaosExecutionStatus.CANCELLED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: ChaosSeverity) => {
    switch (severity) {
      case ChaosSeverity.LOW:
        return 'bg-green-100 text-green-800';
      case ChaosSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case ChaosSeverity.HIGH:
        return 'bg-orange-100 text-orange-800';
      case ChaosSeverity.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: ChaosTestCategory) => {
    switch (category) {
      case ChaosTestCategory.KNOWLEDGE_BASE_SYNC:
        return <RotateCcw className="h-4 w-4" />;
      case ChaosTestCategory.DSL_BUNDLE_CORRUPTION:
        return <AlertTriangle className="h-4 w-4" />;
      case ChaosTestCategory.MESSAGING_FAILURE:
        return <Zap className="h-4 w-4" />;
      case ChaosTestCategory.NETWORK_PARTITION:
        return <Shield className="h-4 w-4" />;
      case ChaosTestCategory.RESOURCE_EXHAUSTION:
        return <TrendingUp className="h-4 w-4" />;
      case ChaosTestCategory.AGENT_FAILURE:
        return <Pause className="h-4 w-4" />;
      case ChaosTestCategory.DATABASE_FAILURE:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {executionStatus && (
        <Alert>
          <AlertDescription>{executionStatus}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalTests || 0}</div>
            <p className="text-xs text-muted-foreground">Chaos test executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.passRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Tests above 70% score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Recovery Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.averageRecoveryTime.toFixed(0) || 0}ms</div>
            <p className="text-xs text-muted-foreground">System recovery time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="dashboard">Resilience Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Chaos Test Scenarios</h3>
            <Button onClick={createDefaultScenarios} variant="outline">
              Create Default Scenarios
            </Button>
          </div>

          <div className="grid gap-4">
            {scenarios.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No chaos test scenarios configured</p>
                  <Button onClick={createDefaultScenarios} className="mt-4">
                    Create Default Scenarios
                  </Button>
                </CardContent>
              </Card>
            ) : (
              scenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(scenario.category)}
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(scenario.severity)}>
                          {scenario.severity}
                        </Badge>
                        <Button
                          onClick={() => executeScenario(scenario.id)}
                          disabled={loading}
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Execute
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Target:</span>
                        <p className="text-muted-foreground">{scenario.targetSystem}</p>
                      </div>
                      <div>
                        <span className="font-medium">Failure Mode:</span>
                        <p className="text-muted-foreground">{scenario.failureMode}</p>
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>
                        <p className="text-muted-foreground">{scenario.category.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <p className="text-muted-foreground">
                          {new Date(scenario.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">Execution History</h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No test executions yet</p>
                </CardContent>
              </Card>
            ) : (
              history.map((execution) => (
                <Card key={execution.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{execution.scenario.name}</CardTitle>
                        <CardDescription>
                          {new Date(execution.startTime).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status.replace(/_/g, ' ')}
                        </Badge>
                        {execution.recoveryTime && (
                          <Badge variant="outline">
                            {execution.recoveryTime}ms recovery
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {execution.reports?.[0] && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Resilience Score:</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={execution.reports[0].resilienceScore} className="w-24" />
                            <span className="text-sm font-medium">
                              {execution.reports[0].resilienceScore}/100
                            </span>
                          </div>
                        </div>
                        {execution.autoRecovered && (
                          <Badge className="bg-green-100 text-green-800">
                            Auto-recovered
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <h3 className="text-lg font-semibold">Resilience Dashboard</h3>
          
          {dashboard ? (
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Resilience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboard.averageResilienceScore.toFixed(1)}/100
                    </div>
                    <Progress value={dashboard.averageResilienceScore} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Test Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(dashboard.categoryStats).map(([category, stats]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span>{category.replace(/_/g, ' ')}</span>
                          <span>{stats.avgScore.toFixed(1)}/100</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Recent Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboard.recentExecutions.slice(0, 5).map((execution) => (
                        <div key={execution.id} className="flex justify-between text-sm">
                          <span className="truncate max-w-24">
                            {execution.scenario.name}
                          </span>
                          <span>
                            {execution.reports?.[0]?.resilienceScore || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Availability</span>
                        <span className="text-green-600">98.5%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recovery</span>
                        <span className="text-blue-600">
                          {dashboard.averageRecoveryTime.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span className="text-green-600">
                          {dashboard.passRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    Based on chaos test results and system resilience analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.averageResilienceScore < 70 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          System resilience below threshold. Consider implementing improved monitoring and auto-recovery mechanisms.
                        </AlertDescription>
                      </Alert>
                    )}
                    {dashboard.averageRecoveryTime > 5000 && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Average recovery time is high. Optimize recovery procedures to reduce downtime.
                        </AlertDescription>
                      </Alert>
                    )}
                    {dashboard.passRate < 80 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Test pass rate is low. Review system architecture and implement redundancy where needed.
                        </AlertDescription>
                      </Alert>
                    )}
                    {dashboard.averageResilienceScore >= 70 && 
                     dashboard.averageRecoveryTime <= 5000 && 
                     dashboard.passRate >= 80 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          System demonstrates good resilience characteristics. Continue regular chaos testing.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No dashboard data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}