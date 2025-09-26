'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  Hash,
  Database,
  Network,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Users,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Fingerprint,
  Vault,
  Binary,
  Cpu,
  Globe,
  Award
} from 'lucide-react';

interface ZKProof {
  id: string;
  type: 'COMPLIANCE' | 'IDENTITY' | 'TRANSACTION' | 'REPORT';
  circuit: string;
  publicInputs: string[];
  proof: string;
  verified: boolean;
  timestamp: string;
  verifier: string;
  metadata: Json;
}

interface ZKCircuit {
  id: string;
  name: string;
  description: string;
  type: 'GROTH16' | 'PLONK' | 'STARK' | 'R1CS';
  constraints: number;
  setupComplete: boolean;
  verificationKey: string;
  provingKey: string;
  lastUsed: string;
  performance: {
    provingTime: number;
    verificationTime: number;
    memoryUsage: number;
  };
}

interface ComplianceStatement {
  id: string;
  regulation: string;
  jurisdiction: string;
  statement: string;
  zkCircuitId: string;
  active: boolean;
  createdAt: string;
  lastVerified: string;
  verificationCount: number;
}

interface ZKSession {
  id: string;
  participantId: string;
  circuitId: string;
  status: 'INITIATED' | 'PROVING' | 'VERIFIED' | 'FAILED';
  startTime: string;
  endTime?: string;
  proof?: string;
  publicInputs: string[];
  metadata: Json;
}

export function ZeroKnowledgeCompliance() {
  const [proofs, setProofs] = useState<ZKProof[]>([]);
  const [circuits, setCircuits] = useState<ZKCircuit[]>([]);
  const [statements, setStatements] = useState<ComplianceStatement[]>([]);
  const [sessions, setSessions] = useState<ZKSession[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCircuit, setSelectedCircuit] = useState('');
  const [publicInputs, setPublicInputs] = useState('');

  useEffect(() => {
    fetchProofs();
    fetchCircuits();
    fetchStatements();
    fetchSessions();
  }, []);

  const fetchProofs = async () => {
    try {
      const response = await fetch('/api/zk-compliance/proofs');
      if (response.ok) {
        const data = await response.json();
        setProofs(data.proofs);
      }
    } catch (error) {
      console.error('Error fetching ZK proofs:', error);
    }
  };

  const fetchCircuits = async () => {
    try {
      const response = await fetch('/api/zk-compliance/circuits');
      if (response.ok) {
        const data = await response.json();
        setCircuits(data.circuits);
      }
    } catch (error) {
      console.error('Error fetching ZK circuits:', error);
    }
  };

  const fetchStatements = async () => {
    try {
      const response = await fetch('/api/zk-compliance/statements');
      if (response.ok) {
        const data = await response.json();
        setStatements(data.statements);
      }
    } catch (error) {
      console.error('Error fetching compliance statements:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/zk-compliance/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching ZK sessions:', error);
    }
  };

  const generateProof = async () => {
    if (!selectedCircuit || !publicInputs.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/zk-compliance/proofs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          circuitId: selectedCircuit,
          publicInputs: publicInputs.split(',').map(s => s.trim()),
        }),
      });

      if (response.ok) {
        await fetchProofs();
        await fetchSessions();
        setPublicInputs('');
      }
    } catch (error) {
      console.error('Error generating proof:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyProof = async (proofId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/zk-compliance/proofs/${proofId}/verify`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchProofs();
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupCircuit = async (circuitId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/zk-compliance/circuits/${circuitId}/setup`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchCircuits();
      }
    } catch (error) {
      console.error('Error setting up circuit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCircuitTypeColor = (type: string) => {
    switch (type) {
      case 'GROTH16': return 'text-purple-600';
      case 'PLONK': return 'text-blue-600';
      case 'STARK': return 'text-green-600';
      case 'R1CS': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getProofTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPLIANCE': return <Shield className="w-5 h-5 text-blue-600" />;
      case 'IDENTITY': return <Fingerprint className="w-5 h-5 text-green-600" />;
      case 'TRANSACTION': return <Database className="w-5 h-5 text-purple-600" />;
      case 'REPORT': return <FileText className="w-5 h-5 text-orange-600" />;
      default: return <Hash className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'INITIATED': return 'text-blue-600';
      case 'PROVING': return 'text-yellow-600';
      case 'VERIFIED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'INITIATED': return <Badge className="bg-blue-600">Initiated</Badge>;
      case 'PROVING': return <Badge className="bg-yellow-600">Proving</Badge>;
      case 'VERIFIED': return <Badge className="bg-green-600">Verified</Badge>;
      case 'FAILED': return <Badge className="bg-red-600">Failed</Badge>;
      default: return <Badge className="bg-gray-600">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zero-Knowledge Compliance Proofs</h1>
          <p className="text-muted-foreground">
            Privacy-preserving compliance verification using cryptographic proofs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchProofs(); fetchCircuits(); fetchSessions(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Circuits</CardTitle>
            <Cpu className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{circuits.filter(c => c.setupComplete).length}</div>
            <p className="text-xs text-muted-foreground">ZK circuits ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Proofs</CardTitle>
            <Hash className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proofs.length}</div>
            <p className="text-xs text-muted-foreground">
              {proofs.filter(p => p.verified).length} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Statements</CardTitle>
            <FileText className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statements.filter(s => s.active).length}</div>
            <p className="text-xs text-muted-foreground">Active regulations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'PROVING' || s.status === 'INITIATED').length}
            </div>
            <p className="text-xs text-muted-foreground">Proof sessions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="circuits">ZK Circuits</TabsTrigger>
          <TabsTrigger value="proofs">Proof Generation</TabsTrigger>
          <TabsTrigger value="statements">Compliance Statements</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Recent ZK Proofs
                </CardTitle>
                <CardDescription>
                  Latest zero-knowledge compliance proofs generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {proofs.slice(0, 5).map((proof) => (
                      <div key={proof.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex-shrink-0">
                          {getProofTypeIcon(proof.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{proof.type}</span>
                            <Badge variant={proof.verified ? "default" : "secondary"} className="text-xs">
                              {proof.verified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            Circuit: {proof.circuit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(proof.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {proof.verified ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          )}
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
                  <Cpu className="w-5 h-5" />
                  Circuit Performance
                </CardTitle>
                <CardDescription>
                  Performance metrics for ZK circuits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {circuits.slice(0, 3).map((circuit) => (
                    <div key={circuit.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{circuit.name}</span>
                          <Badge variant="outline" className={getCircuitTypeColor(circuit.type)}>
                            {circuit.type}
                          </Badge>
                        </div>
                        {circuit.setupComplete ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Proving Time</div>
                          <div className="font-medium">{circuit.performance.provingTime}ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Verification</div>
                          <div className="font-medium">{circuit.performance.verificationTime}ms</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Memory</div>
                          <div className="font-medium">{circuit.performance.memoryUsage}MB</div>
                        </div>
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
                <Globe className="w-5 h-5" />
                Active Compliance Statements
              </CardTitle>
              <CardDescription>
                Regulations covered by zero-knowledge compliance proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statements.filter(s => s.active).slice(0, 6).map((statement) => (
                  <div key={statement.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {statement.jurisdiction}
                      </Badge>
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="font-medium text-sm mb-1">{statement.regulation}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {statement.statement.length > 80 
                        ? `${statement.statement.substring(0, 80)}...` 
                        : statement.statement}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Verified: {statement.verificationCount} times</span>
                      <span>{new Date(statement.lastVerified).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circuits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Zero-Knowledge Circuits
              </CardTitle>
              <CardDescription>
                Manage ZK circuits for compliance verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {circuits.map((circuit) => (
                  <div key={circuit.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{circuit.name}</div>
                        <div className="text-sm text-muted-foreground">{circuit.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getCircuitTypeColor(circuit.type)}>
                          {circuit.type}
                        </Badge>
                        {circuit.setupComplete ? (
                          <Badge className="bg-green-600">Setup Complete</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => setupCircuit(circuit.id)}
                            disabled={isLoading}
                          >
                            Setup Circuit
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Constraints</div>
                        <div className="font-medium">{circuit.constraints.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Proving Time</div>
                        <div className="font-medium">{circuit.performance.provingTime}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Verification Time</div>
                        <div className="font-medium">{circuit.performance.verificationTime}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Memory Usage</div>
                        <div className="font-medium">{circuit.performance.memoryUsage}MB</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                      <span>Last Used: {circuit.lastUsed ? new Date(circuit.lastUsed).toLocaleString() : 'Never'}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Keys
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proofs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Generate New Proof
                </CardTitle>
                <CardDescription>
                  Create a zero-knowledge compliance proof
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Circuit</label>
                  <select 
                    value={selectedCircuit}
                    onChange={(e) => setSelectedCircuit(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">Choose a circuit...</option>
                    {circuits.filter(c => c.setupComplete).map((circuit) => (
                      <option key={circuit.id} value={circuit.id}>
                        {circuit.name} ({circuit.type})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Public Inputs (comma-separated)</label>
                  <Textarea
                    value={publicInputs}
                    onChange={(e) => setPublicInputs(e.target.value)}
                    placeholder="Enter public inputs separated by commas..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={generateProof}
                  disabled={!selectedCircuit || !publicInputs.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Proof...
                    </>
                  ) : (
                    <>
                      <Hash className="w-4 h-4 mr-2" />
                      Generate Proof
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Proof History
                </CardTitle>
                <CardDescription>
                  Previously generated zero-knowledge proofs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {proofs.map((proof) => (
                      <div key={proof.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getProofTypeIcon(proof.type)}
                            <span className="font-medium text-sm">{proof.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {proof.verified ? (
                              <Badge className="bg-green-600">Verified</Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => verifyProof(proof.id)}
                                disabled={isLoading}
                              >
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Circuit: {proof.circuit}</div>
                          <div>Verifier: {proof.verifier}</div>
                          <div>Created: {new Date(proof.timestamp).toLocaleString()}</div>
                          <div className="font-mono text-xs bg-muted p-1 rounded">
                            Proof: {proof.proof.substring(0, 32)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Compliance Statements
              </CardTitle>
              <CardDescription>
                Regulatory statements covered by zero-knowledge proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statements.map((statement) => (
                  <div key={statement.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{statement.regulation}</div>
                        <div className="text-sm text-muted-foreground">
                          {statement.jurisdiction} • Circuit: {statement.zkCircuitId}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statement.active ? "default" : "secondary"}>
                          {statement.active ? "Active" : "Inactive"}
                        </Badge>
                        <Award className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1">Statement</div>
                      <div className="text-sm text-muted-foreground">{statement.statement}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Created</div>
                        <div className="font-medium">{new Date(statement.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last Verified</div>
                        <div className="font-medium">{new Date(statement.lastVerified).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Verifications</div>
                        <div className="font-medium">{statement.verificationCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-medium">{statement.active ? "Active" : "Inactive"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Proof Sessions
              </CardTitle>
              <CardDescription>
                Active and historical zero-knowledge proof sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">Session {session.id.substring(0, 8)}</div>
                        <div className="text-sm text-muted-foreground">
                          Participant: {session.participantId} • Circuit: {session.circuitId}
                        </div>
                      </div>
                      {getSessionStatusBadge(session.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-muted-foreground">Started</div>
                        <div className="font-medium">{new Date(session.startTime).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Ended</div>
                        <div className="font-medium">
                          {session.endTime ? new Date(session.endTime).toLocaleString() : 'Ongoing'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-medium">
                          {session.endTime 
                            ? `${Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)}s`
                            : 'In progress'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Public Inputs</div>
                        <div className="font-medium">{session.publicInputs.length}</div>
                      </div>
                    </div>
                    
                    {session.proof && (
                      <div>
                        <div className="text-sm font-medium mb-1">Generated Proof</div>
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                          {session.proof.substring(0, 64)}...
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}