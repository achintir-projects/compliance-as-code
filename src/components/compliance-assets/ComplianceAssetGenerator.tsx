'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code, Server, Package, Rocket, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface GeneratedAsset {
  id: string;
  type: 'api' | 'microservice' | 'sdk';
  language: string;
  ruleId: string;
  endpoints?: string[];
  config: any;
  status: 'generated' | 'deployed' | 'failed';
}

export function ComplianceAssetGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [selectedSource, setSelectedSource] = useState<'airtable' | 'custom'>('airtable');
  const [includeCommonRules, setIncludeCommonRules] = useState(true);

  const generateAssets = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedAssets([]);

    try {
      const response = await fetch('/api/compliance-assets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: selectedSource,
          generateCommonRules: includeCommonRules,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedAssets(data.assets);
        setProgress(100);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating assets:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const deployAsset = async (assetId: string) => {
    try {
      const response = await fetch(`/api/compliance-assets/deploy/${assetId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setGeneratedAssets(prev =>
          prev.map(asset =>
            asset.id === assetId ? { ...asset, status: 'deployed' } : asset
          )
        );
      }
    } catch (error) {
      console.error('Error deploying asset:', error);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Code className="h-4 w-4" />;
      case 'microservice':
        return <Server className="h-4 w-4" />;
      case 'sdk':
        return <Package className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="h-5 w-5" />
            <span>Compliance Asset Generator</span>
          </CardTitle>
          <CardDescription>
            Convert Airtable knowledge base entries into deployable compliance microservices, APIs, and SDKs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as 'airtable' | 'custom')}
                className="w-full p-2 border rounded-md"
              >
                <option value="airtable">Airtable Knowledge Base</option>
                <option value="custom">Custom Rules</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Include Common Rules</label>
              <select
                value={includeCommonRules ? 'yes' : 'no'}
                onChange={(e) => setIncludeCommonRules(e.target.value === 'yes')}
                className="w-full p-2 border rounded-md"
              >
                <option value="yes">Yes (AML, KYC, Basel III)</option>
                <option value="no">No</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={generateAssets}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Assets'}
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating compliance assets...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {generatedAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Assets</CardTitle>
            <CardDescription>
              {generatedAssets.length} compliance assets ready for deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All ({generatedAssets.length})</TabsTrigger>
                <TabsTrigger value="api">APIs ({generatedAssets.filter(a => a.type === 'api').length})</TabsTrigger>
                <TabsTrigger value="microservice">Microservices ({generatedAssets.filter(a => a.type === 'microservice').length})</TabsTrigger>
                <TabsTrigger value="sdk">SDKs ({generatedAssets.filter(a => a.type === 'sdk').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {generatedAssets.map((asset) => (
                  <Card key={asset.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getAssetIcon(asset.type)}
                        <div>
                          <h4 className="font-medium">{asset.id}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{asset.type}</Badge>
                            <Badge variant="secondary">{asset.language}</Badge>
                            {getStatusIcon(asset.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {asset.endpoints && (
                          <div className="text-sm text-muted-foreground">
                            {asset.endpoints.length} endpoints
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deployAsset(asset.id)}
                          disabled={asset.status === 'deployed'}
                        >
                          {asset.status === 'deployed' ? 'Deployed' : 'Deploy'}
                        </Button>
                      </div>
                    </div>
                    
                    {asset.endpoints && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-1">Endpoints:</div>
                        <div className="space-y-1">
                          {asset.endpoints.map((endpoint, index) => (
                            <code key={index} className="text-xs bg-muted px-2 py-1 rounded">
                              {endpoint}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="api">
                {generatedAssets.filter(a => a.type === 'api').map((asset) => (
                  <Card key={asset.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Code className="h-4 w-4" />
                        <div>
                          <h4 className="font-medium">{asset.id}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">API</Badge>
                            <Badge variant="secondary">{asset.language}</Badge>
                            {getStatusIcon(asset.status)}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deployAsset(asset.id)}
                        disabled={asset.status === 'deployed'}
                      >
                        {asset.status === 'deployed' ? 'Deployed' : 'Deploy'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="microservice">
                {generatedAssets.filter(a => a.type === 'microservice').map((asset) => (
                  <Card key={asset.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Server className="h-4 w-4" />
                        <div>
                          <h4 className="font-medium">{asset.id}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">Microservice</Badge>
                            <Badge variant="secondary">{asset.language}</Badge>
                            {getStatusIcon(asset.status)}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deployAsset(asset.id)}
                        disabled={asset.status === 'deployed'}
                      >
                        {asset.status === 'deployed' ? 'Deployed' : 'Deploy'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="sdk">
                {generatedAssets.filter(a => a.type === 'sdk').map((asset) => (
                  <Card key={asset.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Package className="h-4 w-4" />
                        <div>
                          <h4 className="font-medium">{asset.id}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">SDK</Badge>
                            <Badge variant="secondary">{asset.language}</Badge>
                            {getStatusIcon(asset.status)}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deployAsset(asset.id)}
                        disabled={asset.status === 'deployed'}
                      >
                        {asset.status === 'deployed' ? 'Published' : 'Publish'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>Impact:</strong> Lowers adoption friction → institutions deploy GlassBox within days instead of months.
          Every Airtable rule becomes immediately deployable as code with full SDK support.
        </AlertDescription>
      </Alert>
    </div>
  );
}