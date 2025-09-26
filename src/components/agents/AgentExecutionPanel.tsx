'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Settings, Activity, Zap, Shield, BarChart3 } from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  type: string;
  pack?: string;
  config: any;
  capabilities: string[];
  runtimeType: 'WASM' | 'FIRECRACKER' | 'DOCKER';
  quotas: {
    memory: number;
    cpu: number;
    executionTime: number;
  };
  tenantId: string;
}

interface AgentTask {
  id: string;
  action: string;
  resource: string;
  data: any;
  metadata?: any;
}

interface ExecutionResult {
  taskId: string;
  output: any;
  resourceUsage: {
    memoryUsed: number;
    cpuUsed: number;
    executionTime: number;
  };
  confidence?: number;
  explainability?: any;
}

export function AgentExecutionPanel() {
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    id: 'agent-001',
    name: 'Sample Agent',
    type: 'ONBOARDING_AGENT',
    pack: 'COMMERCIAL_BANKING',
    config: {},
    capabilities: ['KYC', 'AML', 'RISK_ASSESSMENT'],
    runtimeType: 'WASM',
    quotas: {
      memory: 512,
      cpu: 1,
      executionTime: 300
    },
    tenantId: 'tenant-1'
  });

  const [task, setTask] = useState<AgentTask>({
    id: 'task-001',
    action: 'verify_kyc',
    resource: 'customer_profile',
    data: {
      customerId: 'cust-001',
      documents: ['id_card', 'proof_of_address']
    },
    metadata: {
      priority: 'normal',
      requestedBy: 'user-001'
    }
  });

  const [executionOptions, setExecutionOptions] = useState({
    timeout: 60,
    enableMonitoring: true,
    enableProfiling: false
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState(0);

  const executeAgent = async () => {
    setIsExecuting(true);
    setError(null);
    setResult(null);
    setExecutionProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExecutionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentConfig,
          task,
          options: executionOptions
        }),
      });

      clearInterval(progressInterval);
      setExecutionProgress(100);

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to execute agent');
      console.error('Execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const getRuntimeIcon = (runtimeType: string) => {
    switch (runtimeType) {
      case 'WASM':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'FIRECRACKER':
        return <Shield className="w-4 h-4 text-green-600" />;
      case 'DOCKER':
        return <Activity className="w-4 h-4 text-orange-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRuntimeColor = (runtimeType: string) => {
    switch (runtimeType) {
      case 'WASM':
        return 'bg-blue-100 text-blue-800';
      case 'FIRECRACKER':
        return 'bg-green-100 text-green-800';
      case 'DOCKER':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Execution</h2>
          <p className="text-muted-foreground">
            Execute agents in isolated runtime environments
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Agent Configuration</TabsTrigger>
          <TabsTrigger value="task">Task Definition</TabsTrigger>
          <TabsTrigger value="options">Execution Options</TabsTrigger>
          <TabsTrigger value="result">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>
                Configure the agent that will be executed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agentId">Agent ID</Label>
                  <Input
                    id="agentId"
                    value={agentConfig.id}
                    onChange={(e) => setAgentConfig({ ...agentConfig, id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="agentName">Name</Label>
                  <Input
                    id="agentName"
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agentType">Type</Label>
                  <Select value={agentConfig.type} onValueChange={(value) => setAgentConfig({ ...agentConfig, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONBOARDING_AGENT">Onboarding Agent</SelectItem>
                      <SelectItem value="CREDIT_RISK_AGENT">Credit Risk Agent</SelectItem>
                      <SelectItem value="FRAUD_DETECTION_AGENT">Fraud Detection Agent</SelectItem>
                      <SelectItem value="PAYMENT_ROUTING_AGENT">Payment Routing Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="runtimeType">Runtime Type</Label>
                  <Select value={agentConfig.runtimeType} onValueChange={(value: any) => setAgentConfig({ ...agentConfig, runtimeType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WASM">WASM</SelectItem>
                      <SelectItem value="FIRECRACKER">Firecracker</SelectItem>
                      <SelectItem value="DOCKER">Docker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Runtime Environment</Label>
                <div className="flex items-center space-x-2 mt-2">
                  {getRuntimeIcon(agentConfig.runtimeType)}
                  <Badge className={getRuntimeColor(agentConfig.runtimeType)}>
                    {agentConfig.runtimeType}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="memoryQuota">Memory Quota (MB)</Label>
                  <Input
                    id="memoryQuota"
                    type="number"
                    value={agentConfig.quotas.memory}
                    onChange={(e) => setAgentConfig({
                      ...agentConfig,
                      quotas: { ...agentConfig.quotas, memory: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="cpuQuota">CPU Quota (cores)</Label>
                  <Input
                    id="cpuQuota"
                    type="number"
                    step="0.1"
                    value={agentConfig.quotas.cpu}
                    onChange={(e) => setAgentConfig({
                      ...agentConfig,
                      quotas: { ...agentConfig.quotas, cpu: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="timeQuota">Time Quota (seconds)</Label>
                  <Input
                    id="timeQuota"
                    type="number"
                    value={agentConfig.quotas.executionTime}
                    onChange={(e) => setAgentConfig({
                      ...agentConfig,
                      quotas: { ...agentConfig.quotas, executionTime: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="task">
          <Card>
            <CardHeader>
              <CardTitle>Task Definition</CardTitle>
              <CardDescription>
                Define the task for the agent to execute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskId">Task ID</Label>
                  <Input
                    id="taskId"
                    value={task.id}
                    onChange={(e) => setTask({ ...task, id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taskAction">Action</Label>
                  <Input
                    id="taskAction"
                    value={task.action}
                    onChange={(e) => setTask({ ...task, action: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="taskResource">Resource</Label>
                <Input
                  id="taskResource"
                  value={task.resource}
                  onChange={(e) => setTask({ ...task, resource: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="taskData">Task Data (JSON)</Label>
                <textarea
                  id="taskData"
                  className="w-full p-2 border rounded-md min-h-[100px] font-mono text-sm"
                  value={JSON.stringify(task.data, null, 2)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value);
                      setTask({ ...task, data });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Execution Options</CardTitle>
              <CardDescription>
                Configure execution options and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={executionOptions.timeout}
                  onChange={(e) => setExecutionOptions({ ...executionOptions, timeout: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableMonitoring"
                    checked={executionOptions.enableMonitoring}
                    onChange={(e) => setExecutionOptions({ ...executionOptions, enableMonitoring: e.target.checked })}
                  />
                  <Label htmlFor="enableMonitoring">Enable Monitoring</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableProfiling"
                    checked={executionOptions.enableProfiling}
                    onChange={(e) => setExecutionOptions({ ...executionOptions, enableProfiling: e.target.checked })}
                  />
                  <Label htmlFor="enableProfiling">Enable Profiling</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={executeAgent} 
                    disabled={isExecuting}
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{isExecuting ? 'Executing...' : 'Execute Agent'}</span>
                  </Button>
                  
                  {isExecuting && (
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Execution Progress</span>
                        <span>{Math.round(executionProgress)}%</span>
                      </div>
                      <Progress value={executionProgress} className="w-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Execution Results</CardTitle>
                  <CardDescription>
                    Results from agent execution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Task ID</Label>
                      <p className="font-mono text-sm">{result.taskId}</p>
                    </div>
                    <div>
                      <Label>Confidence</Label>
                      <p className="font-mono text-sm">{(result.confidence! * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div>
                    <Label>Output</Label>
                    <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-40">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <Label>Resource Usage</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Memory</span>
                        <p className="font-semibold">{result.resourceUsage.memoryUsed.toFixed(1)} MB</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">CPU</span>
                        <p className="font-semibold">{result.resourceUsage.cpuUsed.toFixed(2)} cores</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Time</span>
                        <p className="font-semibold">{result.resourceUsage.executionTime.toFixed(2)}s</p>
                      </div>
                    </div>
                  </div>

                  {result.explainability && (
                    <div>
                      <Label>Explainability</Label>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-40">
                        {JSON.stringify(result.explainability, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}