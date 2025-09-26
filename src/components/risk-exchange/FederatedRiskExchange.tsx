'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Network, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  Globe, 
  Lock,
  Eye,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  Users,
  Clock,
  MapPin,
  Database,
  Zap
} from 'lucide-react';

interface RiskSignal {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  sourceJurisdiction: string;
  affectedJurisdictions: string[];
  timestamp: string;
  confidence: number;
  isEncrypted: boolean;
  aggregationMethod: string;
  participantCount: number;
  metadata: any;
}

interface NetworkNode {
  id: string;
  name: string;
  jurisdiction: string;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  lastSync: string;
  riskSignalsContributed: number;
  riskSignalsReceived: number;
  encryptionLevel: string;
}

interface AggregatedRisk {
  id: string;
  type: string;
  globalSeverity: number;
  affectedRegions: string[];
  timeWindow: string;
  participantCount: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  privacyMethod: string;
  aggregatedData: any;
}

export function FederatedRiskExchange() {
  const [riskSignals, setRiskSignals] = useState<RiskSignal[]>([]);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [aggregatedRisks, setAggregatedRisks] = useState<AggregatedRisk[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<RiskSignal | null>(null);
  const [isContributing, setIsContributing] = useState(false);
  const [contributionForm, setContributionForm] = useState({
    type: '',
    severity: '',
    category: '',
    description: '',
    affectedJurisdictions: '',
    metadata: ''
  });
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSync: null as Date | null,
    nodesOnline: 0,
    totalNodes: 0
  });

  useEffect(() => {
    fetchRiskSignals();
    fetchNetworkNodes();
    fetchAggregatedRisks();
  }, []);

  const fetchRiskSignals = async () => {
    try {
      const response = await fetch('/api/risk-exchange/signals');
      if (response.ok) {
        const data = await response.json();
        setRiskSignals(data.signals);
      }
    } catch (error) {
      console.error('Error fetching risk signals:', error);
    }
  };

  const fetchNetworkNodes = async () => {
    try {
      const response = await fetch('/api/risk-exchange/nodes');
      if (response.ok) {
        const data = await response.json();
        setNetworkNodes(data.nodes);
        updateSyncStatus(data.nodes);
      }
    } catch (error) {
      console.error('Error fetching network nodes:', error);
    }
  };

  const fetchAggregatedRisks = async () => {
    try {
      const response = await fetch('/api/risk-exchange/aggregated');
      if (response.ok) {
        const data = await response.json();
        setAggregatedRisks(data.risks);
      }
    } catch (error) {
      console.error('Error fetching aggregated risks:', error);
    }
  };

  const updateSyncStatus = (nodes: NetworkNode[]) => {
    const onlineNodes = nodes.filter(node => node.status === 'ONLINE').length;
    setSyncStatus({
      isSyncing: false,
      lastSync: new Date(),
      nodesOnline: onlineNodes,
      totalNodes: nodes.length
    });
  };

  const contributeRiskSignal = async () => {
    try {
      const response = await fetch('/api/risk-exchange/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contributionForm,
          affectedJurisdictions: contributionForm.affectedJurisdictions.split(',').map(j => j.trim())
        }),
      });

      if (response.ok) {
        await fetchRiskSignals();
        setIsContributing(false);
        setContributionForm({
          type: '',
          severity: '',
          category: '',
          description: '',
          affectedJurisdictions: '',
          metadata: ''
        });
      }
    } catch (error) {
      console.error('Error contributing risk signal:', error);
    }
  };

  const syncNetwork = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const response = await fetch('/api/risk-exchange/sync', { method: 'POST' });
      if (response.ok) {
        await fetchNetworkNodes();
        await fetchRiskSignals();
        await fetchAggregatedRisks();
      }
    } catch (error) {
      console.error('Error syncing network:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const downloadAggregatedData = async (riskId: string) => {
    try {
      const response = await fetch(`/api/risk-exchange/aggregated/${riskId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aggregated-risk-${riskId}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading aggregated data:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'text-green-600';
      case 'OFFLINE': return 'text-red-600';
      case 'SYNCING': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const riskTypes = ['FRAUD', 'AML', 'CYBERSECURITY', 'MARKET_RISK', 'CREDIT_RISK', 'OPERATIONAL_RISK'];
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const categories = ['TRANSACTION', 'CUSTOMER', 'NETWORK', 'SYSTEM', 'COMPLIANCE'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Federated Risk Exchange</h1>
          <p className="text-muted-foreground">
            Privacy-preserving risk intelligence sharing across global financial institutions
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isContributing} onOpenChange={setIsContributing}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Contribute Signal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Contribute Risk Signal</DialogTitle>
                <DialogDescription>
                  Share encrypted risk intelligence with the federated network
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Risk Type</Label>
                    <Select value={contributionForm.type} onValueChange={(value) => setContributionForm({...contributionForm, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk type" />
                      </SelectTrigger>
                      <SelectContent>
                        {riskTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={contributionForm.severity} onValueChange={(value) => setContributionForm({...contributionForm, severity: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        {severities.map(severity => (
                          <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={contributionForm.category} onValueChange={(value) => setContributionForm({...contributionForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={contributionForm.description}
                    onChange={(e) => setContributionForm({...contributionForm, description: e.target.value})}
                    placeholder="Describe the risk signal..."
                  />
                </div>
                <div>
                  <Label htmlFor="affectedJurisdictions">Affected Jurisdictions (comma-separated)</Label>
                  <Input
                    id="affectedJurisdictions"
                    value={contributionForm.affectedJurisdictions}
                    onChange={(e) => setContributionForm({...contributionForm, affectedJurisdictions: e.target.value})}
                    placeholder="e.g., UAE, UK, EU, US"
                  />
                </div>
                <div>
                  <Label htmlFor="metadata">Additional Metadata (JSON)</Label>
                  <Textarea
                    id="metadata"
                    value={contributionForm.metadata}
                    onChange={(e) => setContributionForm({...contributionForm, metadata: e.target.value})}
                    placeholder="Additional metadata in JSON format"
                  />
                </div>
                <Button onClick={contributeRiskSignal} className="w-full">
                  Contribute Encrypted Signal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={syncNetwork} disabled={syncStatus.isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            Sync Network
          </Button>
        </div>
      </div>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Network Status
          </CardTitle>
          <CardDescription>
            Real-time status of the federated risk exchange network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncStatus.nodesOnline}</div>
              <div className="text-sm text-muted-foreground">Nodes Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{syncStatus.totalNodes}</div>
              <div className="text-sm text-muted-foreground">Total Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{riskSignals.length}</div>
              <div className="text-sm text-muted-foreground">Active Signals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{aggregatedRisks.length}</div>
              <div className="text-sm text-muted-foreground">Aggregated Risks</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Network Health</span>
              <span>{Math.round((syncStatus.nodesOnline / syncStatus.totalNodes) * 100)}%</span>
            </div>
            <Progress value={(syncStatus.nodesOnline / syncStatus.totalNodes) * 100} className="w-full" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="signals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="signals">Risk Signals</TabsTrigger>
          <TabsTrigger value="network">Network Nodes</TabsTrigger>
          <TabsTrigger value="aggregated">Aggregated Intelligence</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {riskSignals.map((signal) => (
              <Card key={signal.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{signal.type}</CardTitle>
                      <CardDescription className="mt-1">{signal.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(signal.severity)}`} />
                      {signal.isEncrypted && (
                        <Lock className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{signal.category}</Badge>
                    <Badge variant="outline">{signal.sourceJurisdiction}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        <span>Confidence: {signal.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{signal.participantCount} participants</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {signal.affectedJurisdictions.slice(0, 3).map((jurisdiction) => (
                        <Badge key={jurisdiction} variant="secondary" className="text-xs">
                          {jurisdiction}
                        </Badge>
                      ))}
                      {signal.affectedJurisdictions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{signal.affectedJurisdictions.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(signal.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Database className="w-3 h-3" />
                        <span>{signal.aggregationMethod}</span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedSignal(signal)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networkNodes.map((node) => (
              <Card key={node.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{node.name}</CardTitle>
                      <CardDescription>{node.jurisdiction}</CardDescription>
                    </div>
                    <div className={`text-sm font-medium ${getStatusColor(node.status)}`}>
                      {node.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Upload className="w-4 h-4" />
                        <span>{node.riskSignalsContributed} contributed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{node.riskSignalsReceived} received</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last sync: {new Date(node.lastSync).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Lock className="w-3 h-3" />
                        <span>{node.encryptionLevel}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="aggregated" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aggregatedRisks.map((risk) => (
              <Card key={risk.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{risk.type}</CardTitle>
                      <CardDescription>
                        Global risk intelligence with privacy-preserving aggregation
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{risk.privacyMethod}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Severity: {risk.globalSeverity.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{risk.participantCount} participants</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={risk.trend === 'INCREASING' ? 'destructive' : 
                                risk.trend === 'DECREASING' ? 'default' : 'secondary'}
                      >
                        {risk.trend}
                      </Badge>
                      <Badge variant="outline">{risk.timeWindow}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {risk.affectedRegions.slice(0, 3).map((region) => (
                        <Badge key={region} variant="secondary" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                      {risk.affectedRegions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{risk.affectedRegions.length - 3}
                        </Badge>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => downloadAggregatedData(risk.id)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Aggregated Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Signal Distribution</CardTitle>
                <CardDescription>
                  Distribution of risk signals by type and severity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskTypes.map(type => {
                    const typeSignals = riskSignals.filter(s => s.type === type);
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{type}</span>
                          <span>{typeSignals.length} signals</span>
                        </div>
                        <Progress value={(typeSignals.length / riskSignals.length) * 100} className="w-full" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>
                  Risk signals by geographic region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['UAE', 'UK', 'EU', 'US', 'Singapore'].map(region => {
                    const regionSignals = riskSignals.filter(s => 
                      s.affectedJurisdictions.includes(region)
                    );
                    return (
                      <div key={region} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {region}
                          </span>
                          <span>{regionSignals.length} signals</span>
                        </div>
                        <Progress value={(regionSignals.length / riskSignals.length) * 100} className="w-full" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}