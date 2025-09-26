'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Heart, 
  Shield, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Users,
  Activity,
  Pill,
  Hospital,
  Stethoscope,
  Ambulance,
  Settings
} from 'lucide-react';

interface HealthCompliancePack {
  id: string;
  name: string;
  regulation: 'HIPAA' | 'DHA' | 'GDPR-Health' | 'HL7' | 'FHIR' | 'DICOM';
  version: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  rules: any[];
  createdAt: string;
  updatedAt: string;
  coverage: {
    dataTypes: string[];
    processes: string[];
    regions: string[];
  };
}

interface HealthComplianceRule {
  id: string;
  packId: string;
  name: string;
  type: 'DATA_PRIVACY' | 'SECURITY' | 'INTEROPERABILITY' | 'CONSENT' | 'RECORD_KEEPING';
  description: string;
  regulation: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  isActive: boolean;
  lastAssessed: string;
  complianceScore: number;
}

interface HealthAuditTrail {
  id: string;
  ruleId: string;
  action: string;
  timestamp: string;
  user: string;
  details: any;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT';
}

export function HealthTechComplianceManager() {
  const [packs, setPacks] = useState<HealthCompliancePack[]>([]);
  const [rules, setRules] = useState<HealthComplianceRule[]>([]);
  const [audits, setAudits] = useState<HealthAuditTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<HealthCompliancePack | null>(null);
  const [isCreatingPack, setIsCreatingPack] = useState(false);

  useEffect(() => {
    fetchHealthComplianceData();
  }, []);

  const fetchHealthComplianceData = async () => {
    try {
      // Mock data for now - in real implementation, these would fetch from API
      setPacks([
        {
          id: '1',
          name: 'HIPAA Compliance Pack',
          regulation: 'HIPAA',
          version: '1.0.0',
          description: 'Comprehensive HIPAA compliance for healthcare data protection',
          status: 'ACTIVE',
          rules: [],
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          coverage: {
            dataTypes: ['PHI', 'PII'],
            processes: ['Data Storage', 'Data Transmission'],
            regions: ['US']
          }
        },
        {
          id: '2',
          name: 'GDPR-Health Pack',
          regulation: 'GDPR-Health',
          version: '1.0.0',
          description: 'EU GDPR compliance for healthcare data',
          status: 'ACTIVE',
          rules: [],
          createdAt: '2024-01-20T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z',
          coverage: {
            dataTypes: ['Health Data', 'Genetic Data'],
            processes: ['Data Processing', 'Consent Management'],
            regions: ['EU']
          }
        }
      ]);

      setRules([
        {
          id: '1',
          packId: '1',
          name: 'PHI Data Encryption',
          type: 'SECURITY',
          description: 'All Protected Health Information must be encrypted at rest and in transit',
          regulation: 'HIPAA',
          severity: 'HIGH',
          isActive: true,
          lastAssessed: '2024-01-25T00:00:00Z',
          complianceScore: 95
        },
        {
          id: '2',
          packId: '1',
          name: 'Access Control',
          type: 'SECURITY',
          description: 'Implement proper access controls for PHI data',
          regulation: 'HIPAA',
          severity: 'HIGH',
          isActive: true,
          lastAssessed: '2024-01-25T00:00:00Z',
          complianceScore: 88
        }
      ]);

      setAudits([
        {
          id: '1',
          ruleId: '1',
          action: 'ASSESSMENT_COMPLETED',
          timestamp: '2024-01-25T10:30:00Z',
          user: 'system',
          details: { score: 95, findings: [] },
          complianceStatus: 'COMPLIANT'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching health compliance data:', error);
      setLoading(false);
    }
  };

  const createHealthCompliancePack = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const packData = {
      name: formData.get('name'),
      regulation: formData.get('regulation'),
      version: formData.get('version'),
      description: formData.get('description'),
      rules: JSON.parse(formData.get('rules') as string),
      coverage: JSON.parse(formData.get('coverage') as string)
    };

    try {
      // Mock API call
      console.log('Creating health compliance pack:', packData);
      await fetchHealthComplianceData();
      setIsCreatingPack(false);
    } catch (error) {
      console.error('Error creating health compliance pack:', error);
    }
  };

  const runComplianceAssessment = async (packId: string) => {
    try {
      // Mock API call
      console.log('Running compliance assessment for pack:', packId);
      await fetchHealthComplianceData();
    } catch (error) {
      console.error('Error running compliance assessment:', error);
    }
  };

  const getRegulationIcon = (regulation: string) => {
    const icons = {
      'HIPAA': <Shield className="w-4 h-4 text-blue-600" />,
      'DHA': <Hospital className="w-4 h-4 text-green-600" />,
      'GDPR-Health': <FileText className="w-4 h-4 text-purple-600" />,
      'HL7': <Activity className="w-4 h-4 text-orange-600" />,
      'FHIR': <Stethoscope className="w-4 h-4 text-red-600" />,
      'DICOM': <Ambulance className="w-4 h-4 text-yellow-600" />
    };

    return icons[regulation as keyof typeof icons] || <Shield className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: { variant: 'default', icon: CheckCircle },
      DRAFT: { variant: 'secondary', icon: Clock },
      DEPRECATED: { variant: 'outline', icon: AlertTriangle },
      COMPLIANT: { variant: 'default', icon: CheckCircle },
      NON_COMPLIANT: { variant: 'destructive', icon: AlertTriangle },
      PARTIALLY_COMPLIANT: { variant: 'secondary', icon: Clock }
    };

    const config = variants[status as keyof typeof variants] || variants.DRAFT;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      HIGH: { variant: 'destructive', label: 'High' },
      MEDIUM: { variant: 'secondary', label: 'Medium' },
      LOW: { variant: 'outline', label: 'Low' }
    };

    const config = variants[severity as keyof typeof variants];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Heart className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">HealthTech Compliance</h2>
          <p className="text-muted-foreground">
            Manage healthcare-specific compliance requirements and regulations
          </p>
        </div>
        <Dialog open={isCreatingPack} onOpenChange={setIsCreatingPack}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Compliance Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Health Compliance Pack</DialogTitle>
              <DialogDescription>
                Define a new healthcare compliance package with specific regulations
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createHealthCompliancePack} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pack Name</label>
                  <Input name="name" placeholder="HIPAA Compliance Pack" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Regulation</label>
                  <Select name="regulation" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select regulation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIPAA">HIPAA</SelectItem>
                      <SelectItem value="DHA">DHA</SelectItem>
                      <SelectItem value="GDPR-Health">GDPR-Health</SelectItem>
                      <SelectItem value="HL7">HL7</SelectItem>
                      <SelectItem value="FHIR">FHIR</SelectItem>
                      <SelectItem value="DICOM">DICOM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <Input name="version" placeholder="1.0.0" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select name="status" defaultValue="DRAFT">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  name="description" 
                  placeholder="Comprehensive HIPAA compliance pack for healthcare data protection"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Rules (JSON)</label>
                <Textarea 
                  name="rules" 
                  placeholder='[{"name": "Data Encryption", "type": "SECURITY", "description": "Encrypt all PHI data"}]'
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Coverage (JSON)</label>
                <Textarea 
                  name="coverage" 
                  placeholder='{"dataTypes": ["PHI", "PII"], "processes": ["Data Storage", "Data Transmission"], "regions": ["US", "EU"]}'
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Create Compliance Pack
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="packs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="packs">Compliance Packs</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="audits">Audit Trail</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="packs" className="space-y-4">
          <div className="grid gap-4">
            {packs.map((pack) => (
              <Card key={pack.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getRegulationIcon(pack.regulation)}
                        {pack.name}
                      </CardTitle>
                      <CardDescription>{pack.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(pack.status)}
                      <Badge variant="outline">{pack.regulation}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Version</p>
                      <p className="text-sm text-muted-foreground">{pack.version}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Rules</p>
                      <p className="text-sm text-muted-foreground">{pack.rules?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Data Types</p>
                      <p className="text-sm text-muted-foreground">
                        {pack.coverage?.dataTypes?.length || 0} types
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(pack.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => runComplianceAssessment(pack.id)}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Run Assessment
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Compliance Rules</CardTitle>
              <CardDescription>
                All healthcare-specific compliance rules across regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Regulation</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Compliance Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Assessed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.type}</Badge>
                      </TableCell>
                      <TableCell>{rule.regulation}</TableCell>
                      <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${rule.complianceScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{rule.complianceScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.isActive ? getStatusBadge('ACTIVE') : getStatusBadge('DEPRECATED')}
                      </TableCell>
                      <TableCell>
                        {new Date(rule.lastAssessed).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Trail</CardTitle>
              <CardDescription>
                Track all compliance-related activities and assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        {new Date(audit.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{audit.ruleId}</TableCell>
                      <TableCell>{audit.action}</TableCell>
                      <TableCell>{audit.user}</TableCell>
                      <TableCell>{getStatusBadge(audit.complianceStatus)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {JSON.stringify(audit.details).substring(0, 50)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  HealthTech compliance score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Packs</CardTitle>
                <Pill className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{packs.filter(p => p.status === 'ACTIVE').length}</div>
                <p className="text-xs text-muted-foreground">
                  Compliance packs deployed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rules Monitored</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</div>
                <p className="text-xs text-muted-foreground">
                  Active compliance rules
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Regulation Coverage</CardTitle>
              <CardDescription>
                Breakdown of compliance coverage by healthcare regulation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['HIPAA', 'DHA', 'GDPR-Health', 'HL7', 'FHIR', 'DICOM'].map((regulation) => {
                  const regulationPacks = packs.filter(p => p.regulation === regulation);
                  const regulationRules = rules.filter(r => r.regulation === regulation);
                  const avgScore = regulationRules.length > 0 
                    ? regulationRules.reduce((sum, r) => sum + r.complianceScore, 0) / regulationRules.length 
                    : 0;

                  return (
                    <div key={regulation} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRegulationIcon(regulation)}
                        <div>
                          <p className="font-medium">{regulation}</p>
                          <p className="text-sm text-muted-foreground">
                            {regulationPacks.length} packs, {regulationRules.length} rules
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${avgScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{avgScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}