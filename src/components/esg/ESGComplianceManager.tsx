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
import { Progress } from '@/components/ui/progress';
import { 
  Leaf, 
  Globe, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Users,
  TrendingUp,
  TrendingDown,
  Factory,
  Building,
  TreePine,
  Droplets,
  Wind,
  Zap,
  Settings
} from 'lucide-react';

interface ESGCompliancePack {
  id: string;
  name: string;
  regulation: 'EU_TAXONOMY' | 'TCFD' | 'SASB' | 'GRI' | 'CSRD' | 'SFDR';
  version: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  metrics: any[];
  createdAt: string;
  updatedAt: string;
  coverage: {
    environmental: string[];
    social: string[];
    governance: string[];
  };
}

interface ESGMetric {
  id: string;
  packId: string;
  name: string;
  category: 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE';
  type: 'CARBON_EMISSIONS' | 'ENERGY_CONSUMPTION' | 'WATER_USAGE' | 'DIVERSITY' | 'BOARD_COMPOSITION' | 'ETHICAL_CONDUCT';
  description: string;
  regulation: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  isActive: boolean;
  lastAssessed: string;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

interface ESGReport {
  id: string;
  packId: string;
  title: string;
  period: string;
  overallScore: number;
  categoryScores: {
    environmental: number;
    social: number;
    governance: number;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  publishedAt?: string;
}

export function ESGComplianceManager() {
  const [packs, setPacks] = useState<ESGCompliancePack[]>([]);
  const [metrics, setMetrics] = useState<ESGMetric[]>([]);
  const [reports, setReports] = useState<ESGReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<ESGCompliancePack | null>(null);
  const [isCreatingPack, setIsCreatingPack] = useState(false);

  useEffect(() => {
    fetchESGComplianceData();
  }, []);

  const fetchESGComplianceData = async () => {
    try {
      // Mock data for now - in real implementation, these would fetch from API
      setPacks([
        {
          id: '1',
          name: 'EU Taxonomy Compliance Pack',
          regulation: 'EU_TAXONOMY',
          version: '1.0.0',
          description: 'EU Taxonomy compliance for sustainable finance activities',
          status: 'ACTIVE',
          metrics: [],
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          coverage: {
            environmental: ['Climate Change Mitigation', 'Climate Change Adaptation'],
            social: ['Labor Practices', 'Human Rights'],
            governance: ['Board Independence', 'Ethical Conduct']
          }
        },
        {
          id: '2',
          name: 'TCFD Reporting Pack',
          regulation: 'TCFD',
          version: '1.0.0',
          description: 'Task Force on Climate-related Financial Disclosures compliance',
          status: 'ACTIVE',
          metrics: [],
          createdAt: '2024-01-20T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z',
          coverage: {
            environmental: ['Climate Risk', 'Carbon Emissions'],
            social: ['Stakeholder Engagement'],
            governance: ['Risk Management', 'Strategy Oversight']
          }
        }
      ]);

      setMetrics([
        {
          id: '1',
          packId: '1',
          name: 'Carbon Emissions Scope 1',
          category: 'ENVIRONMENTAL',
          type: 'CARBON_EMISSIONS',
          description: 'Direct greenhouse gas emissions from owned or controlled sources',
          regulation: 'EU_TAXONOMY',
          unit: 'tCO2e',
          targetValue: 1000,
          currentValue: 850,
          isActive: true,
          lastAssessed: '2024-01-25T00:00:00Z',
          trend: 'IMPROVING'
        },
        {
          id: '2',
          packId: '1',
          name: 'Energy Consumption',
          category: 'ENVIRONMENTAL',
          type: 'ENERGY_CONSUMPTION',
          description: 'Total energy consumption from all sources',
          regulation: 'EU_TAXONOMY',
          unit: 'MWh',
          targetValue: 5000,
          currentValue: 4800,
          isActive: true,
          lastAssessed: '2024-01-25T00:00:00Z',
          trend: 'IMPROVING'
        },
        {
          id: '3',
          packId: '2',
          name: 'Board Diversity',
          category: 'GOVERNANCE',
          type: 'BOARD_COMPOSITION',
          description: 'Percentage of diverse board members',
          regulation: 'TCFD',
          unit: '%',
          targetValue: 40,
          currentValue: 35,
          isActive: true,
          lastAssessed: '2024-01-25T00:00:00Z',
          trend: 'IMPROVING'
        }
      ]);

      setReports([
        {
          id: '1',
          packId: '1',
          title: 'Q1 2024 EU Taxonomy Report',
          period: '2024-Q1',
          overallScore: 87,
          categoryScores: {
            environmental: 92,
            social: 85,
            governance: 84
          },
          status: 'PUBLISHED',
          createdAt: '2024-01-25T00:00:00Z',
          publishedAt: '2024-01-25T00:00:00Z'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching ESG compliance data:', error);
      setLoading(false);
    }
  };

  const createESGCompliancePack = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const packData = {
      name: formData.get('name'),
      regulation: formData.get('regulation'),
      version: formData.get('version'),
      description: formData.get('description'),
      metrics: JSON.parse(formData.get('metrics') as string),
      coverage: JSON.parse(formData.get('coverage') as string)
    };

    try {
      // Mock API call
      console.log('Creating ESG compliance pack:', packData);
      await fetchESGComplianceData();
      setIsCreatingPack(false);
    } catch (error) {
      console.error('Error creating ESG compliance pack:', error);
    }
  };

  const generateESGReport = async (packId: string) => {
    try {
      // Mock API call
      console.log('Generating ESG report for pack:', packId);
      await fetchESGComplianceData();
    } catch (error) {
      console.error('Error generating ESG report:', error);
    }
  };

  const getRegulationIcon = (regulation: string) => {
    const icons = {
      'EU_TAXONOMY': <Globe className="w-4 h-4 text-green-600" />,
      'TCFD': <Leaf className="w-4 h-4 text-blue-600" />,
      'SASB': <Building className="w-4 h-4 text-purple-600" />,
      'GRI': <FileText className="w-4 h-4 text-orange-600" />,
      'CSRD': <Factory className="w-4 h-4 text-red-600" />,
      'SFDR': <TrendingUp className="w-4 h-4 text-yellow-600" />
    };

    return icons[regulation as keyof typeof icons] || <Globe className="w-4 h-4" />;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'ENVIRONMENTAL': <TreePine className="w-4 h-4 text-green-600" />,
      'SOCIAL': <Users className="w-4 h-4 text-blue-600" />,
      'GOVERNANCE': <Building className="w-4 h-4 text-purple-600" />
    };

    return icons[category as keyof typeof icons] || <Leaf className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: { variant: 'default', icon: CheckCircle },
      DRAFT: { variant: 'secondary', icon: Clock },
      DEPRECATED: { variant: 'outline', icon: AlertTriangle },
      PUBLISHED: { variant: 'default', icon: CheckCircle },
      ARCHIVED: { variant: 'outline', icon: AlertTriangle },
      IMPROVING: { variant: 'default', icon: TrendingUp },
      STABLE: { variant: 'secondary', icon: Clock },
      DECLINING: { variant: 'destructive', icon: TrendingDown }
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

  const getMetricIcon = (type: string) => {
    const icons = {
      'CARBON_EMISSIONS': <Factory className="w-4 h-4 text-gray-600" />,
      'ENERGY_CONSUMPTION': <Zap className="w-4 h-4 text-yellow-600" />,
      'WATER_USAGE': <Droplets className="w-4 h-4 text-blue-600" />,
      'DIVERSITY': <Users className="w-4 h-4 text-purple-600" />,
      'BOARD_COMPOSITION': <Building className="w-4 h-4 text-red-600" />,
      'ETHICAL_CONDUCT': <FileText className="w-4 h-4 text-green-600" />
    };

    return icons[type as keyof typeof icons] || <Leaf className="w-4 h-4" />;
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Leaf className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ESG Compliance</h2>
          <p className="text-muted-foreground">
            Manage Environmental, Social, and Governance compliance requirements
          </p>
        </div>
        <Dialog open={isCreatingPack} onOpenChange={setIsCreatingPack}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create ESG Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create ESG Compliance Pack</DialogTitle>
              <DialogDescription>
                Define a new ESG compliance package with specific regulations and metrics
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createESGCompliancePack} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pack Name</label>
                  <Input name="name" placeholder="EU Taxonomy Compliance Pack" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Regulation</label>
                  <Select name="regulation" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select regulation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EU_TAXONOMY">EU Taxonomy</SelectItem>
                      <SelectItem value="TCFD">TCFD</SelectItem>
                      <SelectItem value="SASB">SASB</SelectItem>
                      <SelectItem value="GRI">GRI</SelectItem>
                      <SelectItem value="CSRD">CSRD</SelectItem>
                      <SelectItem value="SFDR">SFDR</SelectItem>
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
                  placeholder="EU Taxonomy compliance for sustainable finance activities"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Metrics (JSON)</label>
                <Textarea 
                  name="metrics" 
                  placeholder='[{"name": "Carbon Emissions", "type": "CARBON_EMISSIONS", "unit": "tCO2e", "target": 1000}]'
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Coverage (JSON)</label>
                <Textarea 
                  name="coverage" 
                  placeholder='{"environmental": ["Climate Change"], "social": ["Labor Practices"], "governance": ["Board Independence"]}'
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Create ESG Pack
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="packs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="packs">ESG Packs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
                      <Badge variant="outline">{pack.regulation.replace('_', ' ')}</Badge>
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
                      <p className="text-sm font-medium">Metrics</p>
                      <p className="text-sm text-muted-foreground">{pack.metrics?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Environmental</p>
                      <p className="text-sm text-muted-foreground">
                        {pack.coverage?.environmental?.length || 0} areas
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
                      onClick={() => generateESGReport(pack.id)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
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

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ESG Metrics</CardTitle>
              <CardDescription>
                Track environmental, social, and governance performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Regulation</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => {
                    const progress = (metric.currentValue / metric.targetValue) * 100;
                    return (
                      <TableRow key={metric.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {getMetricIcon(metric.type)}
                          {metric.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(metric.category)}
                            <Badge variant="outline">{metric.category}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{metric.regulation.replace('_', ' ')}</TableCell>
                        <TableCell>
                          {metric.currentValue} {metric.unit}
                        </TableCell>
                        <TableCell>
                          {metric.targetValue} {metric.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={Math.min(progress, 100)} 
                              className="w-16 h-2"
                            />
                            <span className="text-sm">{progress.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(metric.trend)}</TableCell>
                        <TableCell>
                          {metric.isActive ? getStatusBadge('ACTIVE') : getStatusBadge('DEPRECATED')}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ESG Reports</CardTitle>
              <CardDescription>
                Generated ESG compliance reports and disclosures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Overall Score</TableHead>
                    <TableHead>Environmental</TableHead>
                    <TableHead>Social</TableHead>
                    <TableHead>Governance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{report.period}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${report.overallScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{report.overallScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{report.categoryScores.environmental}%</TableCell>
                      <TableCell>{report.categoryScores.social}%</TableCell>
                      <TableCell>{report.categoryScores.governance}%</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {report.publishedAt 
                          ? new Date(report.publishedAt).toLocaleDateString()
                          : 'Not published'
                        }
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall ESG Score</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.5%</div>
                <p className="text-xs text-muted-foreground">
                  Average across all packs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Packs</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{packs.filter(p => p.status === 'ACTIVE').length}</div>
                <p className="text-xs text-muted-foreground">
                  ESG compliance packs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metrics Tracked</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.filter(m => m.isActive).length}</div>
                <p className="text-xs text-muted-foreground">
                  Active ESG metrics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.filter(r => r.status === 'PUBLISHED').length}</div>
                <p className="text-xs text-muted-foreground">
                  Published reports
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-green-600" />
                  Environmental
                </CardTitle>
                <CardDescription>
                  Environmental performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.filter(m => m.category === 'ENVIRONMENTAL').slice(0, 3).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMetricIcon(metric.type)}
                        <span className="text-sm">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min((metric.currentValue / metric.targetValue) * 100, 100)} 
                          className="w-12 h-2"
                        />
                        <span className="text-xs">{metric.currentValue}{metric.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Social
                </CardTitle>
                <CardDescription>
                  Social responsibility metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.filter(m => m.category === 'SOCIAL').slice(0, 3).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMetricIcon(metric.type)}
                        <span className="text-sm">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min((metric.currentValue / metric.targetValue) * 100, 100)} 
                          className="w-12 h-2"
                        />
                        <span className="text-xs">{metric.currentValue}{metric.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  Governance
                </CardTitle>
                <CardDescription>
                  Governance and ethics metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.filter(m => m.category === 'GOVERNANCE').slice(0, 3).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMetricIcon(metric.type)}
                        <span className="text-sm">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min((metric.currentValue / metric.targetValue) * 100, 100)} 
                          className="w-12 h-2"
                        />
                        <span className="text-xs">{metric.currentValue}{metric.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}