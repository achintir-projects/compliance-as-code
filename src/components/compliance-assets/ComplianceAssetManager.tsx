'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Code, Package, Download, Play, Settings, Plus, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ComplianceAsset {
  id: string;
  name: string;
  type: 'API_ENDPOINT' | 'MICROSERVICE' | 'SDK_STUB' | 'CONTAINER' | 'SERVERLESS';
  language: string;
  description: string;
  regulation: string;
  category: string;
  status: 'GENERATED' | 'DEPLOYED' | 'FAILED' | 'DEPRECATED';
  createdAt: string;
  deployments?: ComplianceAssetDeployment[];
  sdks?: RegulatorySDK[];
}

interface ComplianceAssetDeployment {
  id: string;
  status: 'DEPLOYING' | 'DEPLOYED' | 'FAILED';
  endpoint: string;
  createdAt: string;
}

interface RegulatorySDK {
  id: string;
  language: string;
  version: string;
  status: 'GENERATED' | 'PUBLISHED' | 'DEPRECATED';
  downloadCount: number;
}

export function ComplianceAssetManager() {
  const [assets, setAssets] = useState<ComplianceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<ComplianceAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [knowledgeObjectIds, setKnowledgeObjectIds] = useState<string>('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/compliance-assets/generate');
      const data = await response.json();
      if (data.success) {
        setAssets(data.assets);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAssets = async () => {
    if (!knowledgeObjectIds.trim()) return;

    setIsGenerating(true);
    try {
      const ids = knowledgeObjectIds.split(',').map(id => id.trim());
      const response = await fetch('/api/compliance-assets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeObjectIds: ids })
      });

      const data = await response.json();
      if (data.success) {
        await fetchAssets();
        setKnowledgeObjectIds('');
      }
    } catch (error) {
      console.error('Error generating assets:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const deployAsset = async (assetId: string) => {
    try {
      const response = await fetch('/api/compliance-assets/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId })
      });

      const data = await response.json();
      if (data.success) {
        await fetchAssets();
      }
    } catch (error) {
      console.error('Error deploying asset:', error);
    }
  };

  const generateSDK = async (assetId: string, language: string) => {
    try {
      const response = await fetch('/api/compliance-assets/sdk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, language })
      });

      const data = await response.json();
      if (data.success) {
        await fetchAssets();
      }
    } catch (error) {
      console.error('Error generating SDK:', error);
    }
  };

  const downloadSDK = async (sdkId: string) => {
    try {
      const response = await fetch(`/api/compliance-assets/sdk/${sdkId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glassbox-sdk-${Date.now()}.js`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading SDK:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      GENERATED: { variant: 'secondary', icon: Clock },
      DEPLOYED: { variant: 'default', icon: CheckCircle },
      FAILED: { variant: 'destructive', icon: AlertCircle },
      DEPRECATED: { variant: 'outline', icon: AlertCircle },
      DEPLOYING: { variant: 'secondary', icon: RefreshCw }
    };

    const config = variants[status as keyof typeof variants] || variants.GENERATED;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance Assets</h2>
          <p className="text-muted-foreground">
            Generate, deploy, and manage compliance microservices and SDKs
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Assets
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Compliance Assets</DialogTitle>
              <DialogDescription>
                Convert Knowledge Objects into deployable compliance assets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Knowledge Object IDs</label>
                <Textarea
                  placeholder="Enter comma-separated Knowledge Object IDs"
                  value={knowledgeObjectIds}
                  onChange={(e) => setKnowledgeObjectIds(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={generateAssets} 
                disabled={isGenerating || !knowledgeObjectIds.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Generate Assets
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-4">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {asset.name}
                      </CardTitle>
                      <CardDescription>{asset.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(asset.status)}
                      <Badge variant="outline">{asset.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Regulation</p>
                      <p className="text-sm text-muted-foreground">{asset.regulation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-sm text-muted-foreground">{asset.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Language</p>
                      <p className="text-sm text-muted-foreground">{asset.language}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {asset.status === 'GENERATED' && (
                      <Button
                        size="sm"
                        onClick={() => deployAsset(asset.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Deploy
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Code className="w-4 h-4 mr-2" />
                          Generate SDK
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate SDK</DialogTitle>
                          <DialogDescription>
                            Choose programming language for the SDK
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="javascript">JavaScript</SelectItem>
                              <SelectItem value="python">Python</SelectItem>
                              <SelectItem value="java">Java</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => generateSDK(asset.id, 'javascript')}
                            className="w-full"
                          >
                            Generate SDK
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

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

        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Deployments</CardTitle>
              <CardDescription>
                Currently deployed compliance microservices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Deployed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets
                    .filter(asset => asset.deployments?.length)
                    .flatMap(asset => asset.deployments!.map(deployment => (
                      <TableRow key={deployment.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{getStatusBadge(deployment.status)}</TableCell>
                        <TableCell className="font-mono text-sm">{deployment.endpoint}</TableCell>
                        <TableCell>
                          {new Date(deployment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View Logs
                          </Button>
                        </TableCell>
                      </TableRow>
                    )))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated SDKs</CardTitle>
              <CardDescription>
                Available SDKs for different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets
                    .filter(asset => asset.sdks?.length)
                    .flatMap(asset => asset.sdks!.map(sdk => (
                      <TableRow key={sdk.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sdk.language}</Badge>
                        </TableCell>
                        <TableCell>{sdk.version}</TableCell>
                        <TableCell>{sdk.downloadCount}</TableCell>
                        <TableCell>{getStatusBadge(sdk.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => downloadSDK(sdk.id)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    )))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}