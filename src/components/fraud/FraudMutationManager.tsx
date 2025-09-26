'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Play,
  BarChart3,
  Target,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  FraudMutationLibrary, 
  FraudTestCase, 
  FraudMutationPattern, 
  MutationResult,
  FraudCategory,
  MutationType,
  FraudSeverity
} from '@/lib/fraud/FraudMutationLibrary';

export function FraudMutationManager() {
  const [mutationLibrary] = useState(() => FraudMutationLibrary.getInstance());
  const [patterns, setPatterns] = useState<FraudMutationPattern[]>([]);
  const [testCases, setTestCases] = useState<FraudTestCase[]>([]);
  const [results, setResults] = useState<MutationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<FraudMutationPattern | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<FraudTestCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [campaignResults, setCampaignResults] = useState<any>(null);
  const [isRunningCampaign, setIsRunningCampaign] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allPatterns = mutationLibrary.getMutationPatterns();
      setPatterns(allPatterns);
      
      // Generate some sample test cases
      const sampleTestCases = generateSampleTestCases();
      setTestCases(sampleTestCases);
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  const generateSampleTestCases = (): FraudTestCase[] => {
    return [
      {
        id: 'tc_001',
        name: 'High Value Transaction',
        description: 'Unusually large transaction amount',
        category: FraudCategory.TRANSACTION_FRAUD,
        input: {
          amount: 15000,
          currency: 'USD',
          timestamp: new Date().toISOString(),
          merchant: 'high_value_merchant',
          location: { latitude: 40.7128, longitude: -74.0060 },
          device_id: 'device_001',
          user_id: 'user_001'
        },
        expectedOutput: { isFraud: true, confidence: 0.9 },
        mutationType: MutationType.AMOUNT_MANIPULATION,
        severity: FraudSeverity.HIGH,
        confidence: 0.85,
        metadata: { source: 'synthetic', tags: ['transaction', 'high_value'] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tc_002',
        name: 'Rapid Login Attempts',
        description: 'Multiple login attempts from different locations',
        category: FraudCategory.ACCOUNT_TAKEOVER,
        input: {
          login_attempts: 15,
          time_window: 300000, // 5 minutes
          locations: [
            { latitude: 40.7128, longitude: -74.0060 },
            { latitude: 51.5074, longitude: -0.1278 },
            { latitude: 35.6762, longitude: 139.6503 }
          ],
          devices: ['device_001', 'device_002', 'device_003'],
          user_id: 'user_002'
        },
        expectedOutput: { isFraud: true, confidence: 0.95 },
        mutationType: MutationType.GEOGRAPHIC_SPOOFING,
        severity: FraudSeverity.CRITICAL,
        confidence: 0.9,
        metadata: { source: 'synthetic', tags: ['account_takeover', 'geographic'] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tc_003',
        name: 'Synthetic Identity Application',
        description: 'Application with fabricated identity information',
        category: FraudCategory.SYNTHETIC_IDENTITY,
        input: {
          application_data: {
            name: 'John Doe',
            ssn: '123-45-6789',
            address: '123 Main St',
            credit_score: 750,
            income: 85000
          },
          behavioral_features: {
            typing_speed: 85,
            mouse_movements: 'unnatural_pattern',
            session_duration: 180
          }
        },
        expectedOutput: { isFraud: true, confidence: 0.8 },
        mutationType: MutationType.ADVERSARIAL_NOISE,
        severity: FraudSeverity.HIGH,
        confidence: 0.75,
        metadata: { source: 'synthetic', tags: ['synthetic_identity', 'application'] },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  };

  const applyMutation = async (testCase: FraudTestCase, patternId: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      const result = await mutationLibrary.applyMutation(testCase, patternId);
      setResults(prev => [result, ...prev]);
      
      setSuccess(`Mutation applied successfully. Detection status: ${result.detectionStatus}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const runTestingCampaign = async () => {
    try {
      setIsRunningCampaign(true);
      setError(null);
      setSuccess(null);
      
      const campaignResult = await mutationLibrary.runAdversarialTestingCampaign(testCases);
      setCampaignResults(campaignResult);
      
      setSuccess(`Testing campaign completed. Detection rate: ${(campaignResult.detectionRate * 100).toFixed(1)}%`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunningCampaign(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'TRANSACTION_FRAUD': 'bg-red-100 text-red-800',
      'IDENTITY_FRAUD': 'bg-orange-100 text-orange-800',
      'ACCOUNT_TAKEOVER': 'bg-purple-100 text-purple-800',
      'PAYMENT_FRAUD': 'bg-pink-100 text-pink-800',
      'INSURANCE_FRAUD': 'bg-yellow-100 text-yellow-800',
      'MONEY_LAUNDERING': 'bg-green-100 text-green-800',
      'CREDIT_CARD_FRAUD': 'bg-blue-100 text-blue-800',
      'SYNTHETIC_IDENTITY': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getMutationTypeColor = (type: string) => {
    const colors = {
      'AMOUNT_MANIPULATION': 'bg-red-100 text-red-800',
      'TIMING_VARIATION': 'bg-blue-100 text-blue-800',
      'GEOGRAPHIC_SPOOFING': 'bg-purple-100 text-purple-800',
      'BEHAVIORAL_PERTURBATION': 'bg-green-100 text-green-800',
      'DATA_OBSCURATION': 'bg-yellow-100 text-yellow-800',
      'STRUCTURE_MODIFICATION': 'bg-orange-100 text-orange-800',
      'FEATURE_ENGINEERING': 'bg-pink-100 text-pink-800',
      'ADVERSARIAL_NOISE': 'bg-indigo-100 text-indigo-800',
      'CROSS_DOMAIN_TRANSFER': 'bg-teal-100 text-teal-800',
      'ZERO_DAY_ATTACK': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDetectionStatusColor = (status: string) => {
    const colors = {
      'DETECTED': 'bg-green-100 text-green-800',
      'MISSED': 'bg-red-100 text-red-800',
      'PARTIAL': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fraud Mutation Library</h2>
          <p className="text-muted-foreground">
            Adversarial testing framework for fraud detection systems
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={runTestingCampaign} disabled={isRunningCampaign}>
            {isRunningCampaign ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Campaign...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Testing Campaign
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Patterns
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {campaignResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Testing Campaign Results
            </CardTitle>
            <CardDescription>
              Summary of adversarial testing campaign performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{campaignResults.totalTests}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(campaignResults.detectionRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Detection Rate</div>
                <Progress value={campaignResults.detectionRate * 100} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(campaignResults.evasionRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Evasion Rate</div>
                <Progress value={campaignResults.evasionRate * 100} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {campaignResults.averageConfidenceChange.toFixed(3)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Confidence Change</div>
              </div>
            </div>

            {campaignResults.weakPoints.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2">Weak Points Identified:</h4>
                <div className="flex flex-wrap gap-2">
                  {campaignResults.weakPoints.map((weakPoint: string, index: number) => (
                    <Badge key={index} variant="destructive">
                      {weakPoint}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Mutation Patterns</TabsTrigger>
          <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {patterns.map((pattern) => (
              <Card key={pattern.id} className="h-fit">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{pattern.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {pattern.description}
                      </CardDescription>
                    </div>
                    <Badge className={getMutationTypeColor(pattern.mutationType)}>
                      {pattern.mutationType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Effectiveness</span>
                    <span className="font-medium">{(pattern.effectiveness * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={pattern.effectiveness * 100} />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Detection Rate</span>
                    <span className="font-medium">{(pattern.detectionRate * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={pattern.detectionRate * 100} />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge className={getCategoryColor(pattern.category)}>
                      {pattern.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (testCases.length > 0) {
                          applyMutation(testCases[0], pattern.id);
                        }
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test-cases" className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Mutation Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.map((testCase) => (
                  <TableRow key={testCase.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{testCase.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testCase.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(testCase.category)}>
                        {testCase.category.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(testCase.severity)}>
                        {testCase.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={testCase.confidence * 100} className="w-16" />
                        <span className="text-sm">{(testCase.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMutationTypeColor(testCase.mutationType)}>
                        {testCase.mutationType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTestCase(testCase)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            const pattern = patterns[0]; // Use first pattern for testing
                            applyMutation(testCase, pattern.id);
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {results.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>No test results yet. Run some mutations to see results.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{result.mutationApplied}</CardTitle>
                        <CardDescription>
                          Applied to {result.originalCase.name}
                        </CardDescription>
                      </div>
                      <Badge className={getDetectionStatusColor(result.detectionStatus)}>
                        {result.detectionStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Execution Time</div>
                        <div className="font-medium">{result.executionTime}ms</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Confidence Change</div>
                        <div className={`font-medium ${result.confidenceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {result.confidenceChange > 0 ? '+' : ''}{result.confidenceChange.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Fraud Score</div>
                        <div className="font-medium">{result.agentResponse.fraudScore.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Agent Response</div>
                        <div className="font-medium">
                          {result.agentResponse.isFlagged ? 'Flagged' : 'Not Flagged'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Pattern Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patterns.slice(0, 5).map((pattern) => (
                    <div key={pattern.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{pattern.name}</span>
                        <span>{(pattern.effectiveness * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={pattern.effectiveness * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        result.detectionStatus === 'DETECTED' ? 'bg-green-600' :
                        result.detectionStatus === 'MISSED' ? 'bg-red-600' : 'bg-yellow-600'
                      }`}></div>
                      <div className="flex-1">
                        <span>{result.mutationApplied}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <p className="text-muted-foreground text-sm">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pattern Details Dialog */}
      <Dialog open={!!selectedPattern} onOpenChange={() => setSelectedPattern(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPattern?.name}</DialogTitle>
            <DialogDescription>{selectedPattern?.description}</DialogDescription>
          </DialogHeader>
          {selectedPattern && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Badge className={getCategoryColor(selectedPattern.category)}>
                    {selectedPattern.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Mutation Type</Label>
                  <Badge className={getMutationTypeColor(selectedPattern.mutationType)}>
                    {selectedPattern.mutationType.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Pattern Configuration</Label>
                <Textarea 
                  value={JSON.stringify(selectedPattern.pattern, null, 2)}
                  readOnly
                  rows={6}
                />
              </div>
              
              <div>
                <Label>Parameters</Label>
                <Textarea 
                  value={JSON.stringify(selectedPattern.parameters, null, 2)}
                  readOnly
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Effectiveness</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={selectedPattern.effectiveness * 100} />
                    <span>{(selectedPattern.effectiveness * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <Label>Detection Rate</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={selectedPattern.detectionRate * 100} />
                    <span>{(selectedPattern.detectionRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Case Details Dialog */}
      <Dialog open={!!selectedTestCase} onOpenChange={() => setSelectedTestCase(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTestCase?.name}</DialogTitle>
            <DialogDescription>{selectedTestCase?.description}</DialogDescription>
          </DialogHeader>
          {selectedTestCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Badge className={getCategoryColor(selectedTestCase.category)}>
                    {selectedTestCase.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Badge className={getSeverityColor(selectedTestCase.severity)}>
                    {selectedTestCase.severity}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Input Data</Label>
                <Textarea 
                  value={JSON.stringify(selectedTestCase.input, null, 2)}
                  readOnly
                  rows={6}
                />
              </div>
              
              <div>
                <Label>Expected Output</Label>
                <Textarea 
                  value={JSON.stringify(selectedTestCase.expectedOutput, null, 2)}
                  readOnly
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Confidence</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={selectedTestCase.confidence * 100} />
                    <span>{(selectedTestCase.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <Label>Mutation Type</Label>
                  <Badge className={getMutationTypeColor(selectedTestCase.mutationType)}>
                    {selectedTestCase.mutationType.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Patterns Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Mutation Patterns</DialogTitle>
            <DialogDescription>
              Import mutation patterns from JSON configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="patternData">Pattern Data (JSON)</Label>
              <Textarea
                id="patternData"
                placeholder="Paste JSON pattern data here..."
                rows={8}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button>
                Import Patterns
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}