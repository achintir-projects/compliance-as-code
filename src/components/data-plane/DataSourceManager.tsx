'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Database, Activity, AlertCircle } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'POSTGRES' | 'KAFKA' | 'VECTOR_DB' | 'API' | 'FILE';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

interface DataSourceFormData {
  id: string;
  name: string;
  type: 'POSTGRES' | 'KAFKA' | 'VECTOR_DB' | 'API' | 'FILE';
  connectionString: string;
  tenantId: string;
}

export function DataSourceManager() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DataSourceFormData>({
    id: '',
    name: '',
    type: 'POSTGRES',
    connectionString: '',
    tenantId: 'tenant-1' // Mock tenant ID
  });

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/data-plane/sources?tenantId=${formData.tenantId}`);
      const result = await response.json();
      
      if (result.success) {
        setDataSources(result.dataSources);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch data sources');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/data-plane/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowForm(false);
        setFormData({
          id: '',
          name: '',
          type: 'POSTGRES',
          connectionString: '',
          tenantId: 'tenant-1'
        });
        fetchDataSources();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to register data source');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Sources</h2>
          <p className="text-muted-foreground">
            Manage your data sources for ingestion and processing
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Register New Data Source</CardTitle>
            <CardDescription>
              Configure a new data source for data ingestion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">Data Source ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g., postgres-primary"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Primary PostgreSQL Database"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POSTGRES">PostgreSQL</SelectItem>
                    <SelectItem value="KAFKA">Kafka</SelectItem>
                    <SelectItem value="VECTOR_DB">Vector Database</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                    <SelectItem value="FILE">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="connectionString">Connection String</Label>
                <Input
                  id="connectionString"
                  value={formData.connectionString}
                  onChange={(e) => setFormData({ ...formData, connectionString: e.target.value })}
                  placeholder="e.g., postgresql://user:pass@localhost:5432/db"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register Data Source'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {dataSources.map((source) => (
          <Card key={source.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Database className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">{source.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {source.type} • ID: {source.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(source.status)}>
                    <Activity className="w-3 h-3 mr-1" />
                    {source.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(source.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dataSources.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Sources</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first data source
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Data Source
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}