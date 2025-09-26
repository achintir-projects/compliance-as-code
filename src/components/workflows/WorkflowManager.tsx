'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, Clock, CheckCircle, XCircle, AlertCircle, Plus, FileText } from 'lucide-react';

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  metadata?: any;
}

interface WorkflowStep {
  id: string;
  name: string;
  agentType: string;
  agentId?: string;
  task: any;
  timeout?: number;
  retries?: number;
  dependencies?: string[];
  onFailure?: 'STOP' | 'CONTINUE' | 'ROLLBACK';
}

interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  steps: StepResult[];
  finalResult?: any;
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata?: any;
}

interface StepResult {
  stepId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
  retryCount: number;
  resourceUsage?: any;
}

export function WorkflowManager() {
  const [workflow, setWorkflow] = useState<WorkflowDefinition>({
    id: 'customer-onboarding',
    name: 'Customer Onboarding',
    description: 'Complete customer onboarding workflow with KYC, AML, and risk assessment',
    steps: [
      {
        id: 'step-1',
        name: 'KYC Verification',
        agentType: 'REGULATORY_COMPLIANCE',
        task: {
          action: 'PERFORM_KYC_CHECK',
          resource: 'customer_profile'
        },
        timeout: 300,
        retries: 3,
        onFailure: 'STOP'
      },
      {
        id: 'step-2',
        name: 'AML Screening',
        agentType: 'REGULATORY_COMPLIANCE',
        task: {
          action: 'PERFORM_AML_CHECK',
          resource: 'customer_profile'
        },
        timeout: 300,
        retries: 3,
        onFailure: 'STOP',
        dependencies: ['step-1']
      },
      {
        id: 'step-3',
        name: 'Risk Assessment',
        agentType: 'COMMERCIAL_BANKING',
        task: {
          action: 'ASSESS_RISK',
          resource: 'customer_profile'
        },
        timeout: 600,
        retries: 2,
        onFailure: 'CONTINUE',
        dependencies: ['step-1', 'step-2']
      }
    ]
  });

  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowTemplates, setWorkflowTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    // Load available workflow templates
    const templates = [
      'CUSTOMER_ONBOARDING',
      'LOAN_PROCESSING',
      'PAYMENT_PROCESSING',
      'INSURANCE_CLAIM',
      'WEALTH_MANAGEMENT',
      'COMPLIANCE_AUDIT'
    ];
    setWorkflowTemplates(templates);
  }, []);

  const getTemplateDescription = (template: string): string => {
    const descriptions: Record<string, string> = {
      'CUSTOMER_ONBOARDING': 'Complete customer onboarding with KYC, AML, and risk assessment',
      'LOAN_PROCESSING': 'End-to-end loan processing with credit decision and document generation',
      'PAYMENT_PROCESSING': 'Secure payment processing with fraud detection and settlement',
      'INSURANCE_CLAIM': 'Complete insurance claim processing with assessment and decision',
      'WEALTH_MANAGEMENT': 'Comprehensive wealth management with portfolio optimization and planning',
      'COMPLIANCE_AUDIT': 'Thorough compliance audit with risk assessment and regulatory reporting'
    };
    return descriptions[template] || 'Workflow template for financial processes';
  };

  const loadWorkflowTemplate = async (templateType: string) => {
    try {
      const response = await fetch('/api/workflows/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType,
          tenantId: 'tenant-1'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load workflow template');
      }

      const template = await response.json();
      setWorkflow(template);
      setSelectedTemplate(templateType);
    } catch (error) {
      setError('Failed to load workflow template');
      console.error('Template loading error:', error);
    }
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    setError(null);
    setCurrentExecution(null);

    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow,
          context: {
            tenantId: 'tenant-1',
            userId: 'user-001',
            input: {
              customerId: 'cust-001',
              customerData: {
                name: 'John Doe',
                email: 'john.doe@example.com'
              }
            }
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        const execution: WorkflowExecution = {
          ...data.result,
          startTime: new Date(data.result.startTime),
          endTime: data.result.endTime ? new Date(data.result.endTime) : undefined,
          steps: data.result.steps.map((step: any) => ({
            ...step,
            startTime: step.startTime ? new Date(step.startTime) : undefined,
            endTime: step.endTime ? new Date(step.endTime) : undefined
          }))
        };
        
        setCurrentExecution(execution);
        setExecutions(prev => [execution, ...prev]);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to execute workflow');
      console.error('Workflow execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'RUNNING':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-gray-600" />;
      case 'CANCELLED':
        return <Square className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateWorkflowProgress = (execution: WorkflowExecution) => {
    if (execution.status === 'COMPLETED') return 100;
    if (execution.status === 'FAILED') return 0;
    
    const completedSteps = execution.steps.filter(s => s.status === 'COMPLETED').length;
    const totalSteps = execution.steps.length;
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Orchestration</h2>
          <p className="text-muted-foreground">
            Design and execute multi-agent workflows
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="definition" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="definition">Workflow Definition</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>
                Pre-built workflow templates for common financial processes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflowTemplates.map((template) => (
                  <Card key={template} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <Badge variant="outline">
                          {template.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm">
                        {template.replace(/_/g, ' ')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        {getTemplateDescription(template)}
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => loadWorkflowTemplate(template)}
                      >
                        Load Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedTemplate && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Selected Template:</span>
                    <Badge>{selectedTemplate.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Template loaded and ready for execution. Switch to the "Workflow Definition" tab to review details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definition">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Definition</CardTitle>
              <CardDescription>
                Define the workflow structure and steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workflowId">Workflow ID</Label>
                  <Input
                    id="workflowId"
                    value={workflow.id}
                    onChange={(e) => setWorkflow({ ...workflow, id: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="workflowName">Name</Label>
                  <Input
                    id="workflowName"
                    value={workflow.name}
                    onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="workflowDescription">Description</Label>
                <Input
                  id="workflowDescription"
                  value={workflow.description}
                  onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Workflow Steps</Label>
                <div className="space-y-3 mt-2">
                  {workflow.steps.map((step, index) => (
                    <Card key={step.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">Step {index + 1}</Badge>
                          <span className="font-medium">{step.name}</span>
                        </div>
                        <Badge className={getStatusColor('PENDING')}>
                          {step.agentType}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Action: {step.task.action}</div>
                        <div>Resource: {step.task.resource}</div>
                        <div>Timeout: {step.timeout}s</div>
                        <div>Retries: {step.retries}</div>
                        {step.dependencies && step.dependencies.length > 0 && (
                          <div>Dependencies: {step.dependencies.join(', ')}</div>
                        )}
                        <div>On Failure: {step.onFailure}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={executeWorkflow} 
                    disabled={isExecuting}
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>{isExecuting ? 'Executing...' : 'Execute Workflow'}</span>
                  </Button>
                  
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">
                      {workflow.name} - {workflow.steps.length} steps
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentExecution && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Execution</CardTitle>
                  <CardDescription>
                    Real-time workflow execution status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(currentExecution.status)}
                      <div>
                        <span className="font-medium">{currentExecution.executionId}</span>
                        <div className="text-sm text-muted-foreground">
                          Started: {currentExecution.startTime.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(currentExecution.status)}>
                      {currentExecution.status}
                    </Badge>
                  </div>

                  {currentExecution.status === 'RUNNING' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(calculateWorkflowProgress(currentExecution))}%</span>
                      </div>
                      <Progress value={calculateWorkflowProgress(currentExecution)} className="w-full" />
                    </div>
                  )}

                  <div>
                    <Label>Steps</Label>
                    <div className="space-y-2 mt-2">
                      {currentExecution.steps.map((step, index) => (
                        <div key={step.stepId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(step.status)}
                            <div>
                              <span className="font-medium">{workflow.steps[index].name}</span>
                              {step.startTime && (
                                <div className="text-sm text-muted-foreground">
                                  Duration: {formatDuration(step.startTime, step.endTime)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(step.status)} variant="outline">
                              {step.status}
                            </Badge>
                            {step.retryCount > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Retries: {step.retryCount}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentExecution.finalResult && (
                    <div>
                      <Label>Final Result</Label>
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-40 mt-2">
                        {JSON.stringify(currentExecution.finalResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                Previous workflow executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => (
                  <Card key={execution.executionId}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(execution.status)}
                          <div>
                            <span className="font-medium">{execution.executionId}</span>
                            <div className="text-sm text-muted-foreground">
                              {execution.startTime.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {formatDuration(execution.startTime, execution.endTime)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Steps:</span>
                          <span className="ml-2 font-medium">
                            {execution.steps.filter(s => s.status === 'COMPLETED').length}/{execution.steps.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-2 font-medium">
                            {formatDuration(execution.startTime, execution.endTime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Workflow:</span>
                          <span className="ml-2 font-medium">{execution.workflowId}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {executions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflow executions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}