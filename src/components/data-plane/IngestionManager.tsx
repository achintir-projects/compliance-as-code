'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface Ingestion {
  id: string;
  dataSourceId: string;
  dataType: 'ISO20022' | 'FIBO' | 'ACORD' | 'CUSTOM';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  recordCount?: number;
  errorCount?: number;
  lastSyncAt?: string;
  createdAt: string;
}

interface DataSource {
  id: string;
  name: string;
  type: string;
}

export function IngestionManager() {
  const [ingestions, setIngestions] = useState<Ingestion[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [selectedDataType, setSelectedDataType] = useState<string>('ISO20022');

  useEffect(() => {
    fetchIngestions();
    fetchDataSources();
  }, []);

  const fetchIngestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/data-plane/ingestion?tenantId=tenant-1`);
      const result = await response.json();
      
      if (result.success) {
        setIngestions(result.ingestions);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch ingestions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDataSources = async () => {
    try {
      const response = await fetch(`/api/data-plane/sources?tenantId=tenant-1`);
      const result = await response.json();
      
      if (result.success) {
        setDataSources(result.dataSources);
      }
    } catch (err) {
      console.error('Failed to fetch data sources:', err);
    }
  };

  const startIngestion = async () => {
    if (!selectedDataSource) {
      setError('Please select a data source');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/data-plane/ingestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSourceId: selectedDataSource,
          dataType: selectedDataType,
          tenantId: 'tenant-1'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        fetchIngestions();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to start ingestion');
    } finally {
      setIsLoading(false);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgress = (ingestion: Ingestion) => {
    if (ingestion.status === 'COMPLETED') return 100;
    if (ingestion.status === 'FAILED') return 0;
    if (ingestion.status === 'RUNNING') return 65; // Simulated progress
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Ingestion</h2>
          <p className="text-muted-foreground">
            Monitor and manage data ingestion processes
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Start New Ingestion</CardTitle>
          <CardDescription>
            Configure and start a new data ingestion process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Data Source</label>
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Data Type</label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISO20022">ISO 20022</SelectItem>
                  <SelectItem value="FIBO">FIBO</SelectItem>
                  <SelectItem value="ACORD">ACORD</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startIngestion} disabled={isLoading || !selectedDataSource}>
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? 'Starting...' : 'Start Ingestion'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {ingestions.map((ingestion) => (
          <Card key={ingestion.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(ingestion.status)}
                    <div>
                      <h3 className="font-semibold">Ingestion {ingestion.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ingestion.dataType} • Data Source: {ingestion.dataSourceId}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(ingestion.status)}>
                    {ingestion.status}
                  </Badge>
                </div>

                {ingestion.status === 'RUNNING' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProgress(ingestion)}%</span>
                    </div>
                    <Progress value={getProgress(ingestion)} className="w-full" />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Records:</span>
                    <span className="ml-2 font-medium">
                      {ingestion.recordCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {ingestion.errorCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Started:</span>
                    <span className="ml-2 font-medium">
                      {new Date(ingestion.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {ingestion.lastSyncAt && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span className="ml-2 font-medium">
                      {new Date(ingestion.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ingestions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Ingestions</h3>
            <p className="text-muted-foreground mb-4">
              Start your first data ingestion process
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}