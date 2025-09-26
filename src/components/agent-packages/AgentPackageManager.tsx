'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Settings, Play, Square, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AgentPackage {
  name: string;
  version: string;
  description: string;
  type: string;
  capabilities: string[];
  status: 'REGISTERED' | 'ACTIVE' | 'INACTIVE' | 'ERROR';
}

interface AgentPackageConfig {
  tenantId: string;
  riskAssessmentEnabled?: boolean;
  complianceCheckEnabled?: boolean;
  loanProcessingEnabled?: boolean;
  creditScoringEnabled?: boolean;
  fraudDetectionEnabled?: boolean;
  transactionProcessingEnabled?: boolean;
  underwritingEnabled?: boolean;
  claimsProcessingEnabled?: boolean;
  portfolioOptimizationEnabled?: boolean;
  financialPlanningEnabled?: boolean;
  amlEnabled?: boolean;
  kycEnabled?: boolean;
  regulatoryReportingEnabled?: boolean;
}

interface ExecutionResult {
  result: any;
  packageName: string;
  version: string;
  task: string;
  executedAt: string;
}

export function AgentPackageManager() {
  const [packages, setPackages] = useState<AgentPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<AgentPackage | null>(null);
  const [config, setConfig] = useState<AgentPackageConfig>({ tenantId: 'tenant-1' });
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('packages');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agent-packages?tenantId=${config.tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const registerPackage = async (packageName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/agent-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName,
          tenantId: config.tenantId,
          config
        })
      });

      if (!response.ok) throw new Error('Failed to register package');
      
      await fetchPackages();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const executePackage = async (task: string, data: any = {}) => {
    if (!selectedPackage) return;

    setIsExecuting(true);
    try {
      const response = await fetch('/api/agent-packages/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: selectedPackage.name,
          version: selectedPackage.version,
          task,
          data,
          tenantId: config.tenantId
        })
      });

      if (!response.ok) throw new Error('Failed to execute package');
      
      const result = await response.json();
      setExecutionResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status: AgentPackage['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INACTIVE':
        return <Square className="h-4 w-4 text-gray-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const availablePackages = [
    {
      name: 'Commercial Banking Agent',
      description: 'Comprehensive commercial banking agent for loan processing, risk assessment, and compliance checking',
      type: 'COMMERCIAL_BANKING',
      capabilities: ['LOAN_PROCESSING', 'RISK_ASSESSMENT', 'COMPLIANCE_CHECKING', 'CREDIT_SCORING']
    },
    {
      name: 'Payments Agent',
      description: 'Payment processing agent with transaction handling, fraud detection, and settlement capabilities',
      type: 'PAYMENTS',
      capabilities: ['TRANSACTION_PROCESSING', 'FRAUD_DETECTION', 'SETTLEMENT', 'RECONCILIATION']
    },
    {
      name: 'Insurance Agent',
      description: 'Insurance agent for underwriting, claims processing, and risk modeling',
      type: 'INSURANCE',
      capabilities: ['UNDERWRITING', 'CLAIMS_PROCESSING', 'RISK_MODELING', 'POLICY_MANAGEMENT']
    },
    {
      name: 'Wealth Management Agent',
      description: 'Wealth management agent for portfolio optimization, financial planning, and market analysis',
      type: 'WEALTH_MANAGEMENT',
      capabilities: ['PORTFOLIO_OPTIMIZATION', 'FINANCIAL_PLANNING', 'MARKET_ANALYSIS', 'RISK_MANAGEMENT']
    },
    {
      name: 'Regulatory Compliance Agent',
      description: 'Regulatory compliance agent for AML, KYC, and regulatory reporting',
      type: 'REGULATORY_COMPLIANCE',
      capabilities: ['AML', 'KYC', 'REGULATORY_REPORTING', 'COMPLIANCE_MONITORING']
    }
  ];

  const getTaskOptions = (packageType: string) => {
    switch (packageType) {
      case 'COMMERCIAL_BANKING':
        return [
          { value: 'PROCESS_LOAN_APPLICATION', label: 'Process Loan Application' },
          { value: 'ASSESS_RISK', label: 'Assess Risk' },
          { value: 'PERFORM_COMPLIANCE_CHECK', label: 'Perform Compliance Check' },
          { value: 'MAKE_CREDIT_DECISION', label: 'Make Credit Decision' },
          { value: 'GENERATE_LOAN_DOCUMENTS', label: 'Generate Loan Documents' }
        ];
      case 'PAYMENTS':
        return [
          { value: 'PROCESS_TRANSACTION', label: 'Process Transaction' },
          { value: 'DETECT_FRAUD', label: 'Detect Fraud' },
          { value: 'SETTLE_PAYMENT', label: 'Settle Payment' },
          { value: 'RECONCILE_TRANSACTIONS', label: 'Reconcile Transactions' }
        ];
      case 'INSURANCE':
        return [
          { value: 'UNDERWRITE_POLICY', label: 'Underwrite Policy' },
          { value: 'PROCESS_CLAIM', label: 'Process Claim' },
          { value: 'ASSESS_RISK', label: 'Assess Risk' },
          { value: 'MANAGE_POLICY', label: 'Manage Policy' }
        ];
      case 'WEALTH_MANAGEMENT':
        return [
          { value: 'OPTIMIZE_PORTFOLIO', label: 'Optimize Portfolio' },
          { value: 'CREATE_FINANCIAL_PLAN', label: 'Create Financial Plan' },
          { value: 'ANALYZE_MARKET', label: 'Analyze Market' },
          { value: 'MANAGE_RISK', label: 'Manage Risk' }
        ];
      case 'REGULATORY_COMPLIANCE':
        return [
          { value: 'PERFORM_AML_CHECK', label: 'Perform AML Check' },
          { value: 'PERFORM_KYC_CHECK', label: 'Perform KYC Check' },
          { value: 'GENERATE_REGULATORY_REPORT', label: 'Generate Regulatory Report' },
          { value: 'MONITOR_COMPLIANCE', label: 'Monitor Compliance' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="packages">Agent Packages</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availablePackages.map((pkg) => {
              const isRegistered = packages.some(p => p.name === pkg.name);
              
              return (
                <Card key={pkg.name} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      {isRegistered && getStatusIcon('ACTIVE')}
                    </div>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Capabilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.capabilities.map((capability) => (
                            <Badge key={capability} variant="secondary" className="text-xs">
                              {capability.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => registerPackage(pkg.name)}
                        disabled={isLoading || isRegistered}
                        className="w-full"
                        size="sm"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isRegistered ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {isRegistered ? 'Registered' : 'Register Package'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Package Execution</CardTitle>
                <CardDescription>Execute tasks on registered agent packages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="package-select">Select Package</Label>
                  <Select
                    value={selectedPackage?.name || ''}
                    onValueChange={(value) => {
                      const pkg = packages.find(p => p.name === value);
                      setSelectedPackage(pkg || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.name} value={pkg.name}>
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPackage && (
                  <>
                    <div>
                      <Label htmlFor="task-select">Select Task</Label>
                      <Select onValueChange={(value) => executePackage(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a task" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTaskOptions(selectedPackage.type).map((task) => (
                            <SelectItem key={task.value} value={task.value}>
                              {task.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="task-data">Task Data (JSON)</Label>
                      <Textarea
                        id="task-data"
                        placeholder="Enter task data as JSON"
                        className="min-h-24"
                        onChange={(e) => {
                          try {
                            JSON.parse(e.target.value);
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                      />
                    </div>

                    <Button
                      onClick={() => {
                        const dataTextarea = document.getElementById('task-data') as HTMLTextAreaElement;
                        const data = dataTextarea.value ? JSON.parse(dataTextarea.value) : {};
                        const taskSelect = document.querySelector('[role="combobox"]') as HTMLSelectElement;
                        const task = taskSelect?.value || '';
                        if (task) executePackage(task, data);
                      }}
                      disabled={isExecuting || !selectedPackage}
                      className="w-full"
                    >
                      {isExecuting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Execute Task
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Execution Result</CardTitle>
                <CardDescription>Results from package execution</CardDescription>
              </CardHeader>
              <CardContent>
                {executionResult ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Package:</strong> {executionResult.packageName}
                    </div>
                    <div className="text-sm">
                      <strong>Task:</strong> {executionResult.task}
                    </div>
                    <div className="text-sm">
                      <strong>Executed At:</strong> {new Date(executionResult.executedAt).toLocaleString()}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Result:</Label>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                        {JSON.stringify(executionResult.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No execution results yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Package Configuration</CardTitle>
              <CardDescription>Configure global settings for agent packages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tenant-id">Tenant ID</Label>
                <Input
                  id="tenant-id"
                  value={config.tenantId}
                  onChange={(e) => setConfig({ ...config, tenantId: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Commercial Banking</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="risk-assessment"
                      checked={config.riskAssessmentEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, riskAssessmentEnabled: checked })}
                    />
                    <Label htmlFor="risk-assessment">Risk Assessment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="compliance-check"
                      checked={config.complianceCheckEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, complianceCheckEnabled: checked })}
                    />
                    <Label htmlFor="compliance-check">Compliance Check</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="loan-processing"
                      checked={config.loanProcessingEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, loanProcessingEnabled: checked })}
                    />
                    <Label htmlFor="loan-processing">Loan Processing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="credit-scoring"
                      checked={config.creditScoringEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, creditScoringEnabled: checked })}
                    />
                    <Label htmlFor="credit-scoring">Credit Scoring</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Payments</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fraud-detection"
                      checked={config.fraudDetectionEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, fraudDetectionEnabled: checked })}
                    />
                    <Label htmlFor="fraud-detection">Fraud Detection</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="transaction-processing"
                      checked={config.transactionProcessingEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, transactionProcessingEnabled: checked })}
                    />
                    <Label htmlFor="transaction-processing">Transaction Processing</Label>
                  </div>
                </div>
              </div>

              <Button onClick={() => fetchPackages()} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Apply Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}