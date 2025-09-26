'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Play,
  Pause,
  Settings
} from 'lucide-react';

interface KnowledgeObject {
  id: string;
  confidence: 'High' | 'Medium';
  topic: string;
  category: string;
  content: string;
  status: 'validated' | 'pending_review' | 'deployed';
  lastUpdated: string;
  airtableId: string;
}

interface SyncStatus {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  deployed: number;
  pendingReview: number;
  validated: number;
  categories: string[];
}

interface AutoSyncStatus {
  isRunning: boolean;
  lastSync?: Date;
  nextSync?: Date;
}

export function KnowledgeManager() {
  const [knowledgeObjects, setKnowledgeObjects] = useState<KnowledgeObject[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState<AutoSyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedObject, setSelectedObject] = useState<KnowledgeObject | null>(null);
  const [filters, setFilters] = useState({
    confidence: 'all',
    category: 'all',
    status: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [humanReview, setHumanReview] = useState({
    knowledgeObjectId: '',
    decision: '',
    comments: '',
  });
  const [autoSyncConfig, setAutoSyncConfig] = useState({
    interval: 60, // minutes
    enabled: false,
  });

  useEffect(() => {
    loadSyncStatus();
    loadAutoSyncStatus();
    loadKnowledgeObjects();
  }, [filters]);

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/airtable/sync');
      const data = await response.json();
      if (data.success) {
        setSyncStatus(data.summary);
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const loadAutoSyncStatus = async () => {
    try {
      const response = await fetch('/api/airtable/auto-sync');
      const data = await response.json();
      if (data.success) {
        setAutoSyncStatus(data.status);
        setAutoSyncConfig(prev => ({ ...prev, enabled: data.status.isRunning }));
      }
    } catch (error) {
      console.error('Error loading auto-sync status:', error);
    }
  };

  const loadKnowledgeObjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/airtable/knowledge-objects?${params}`);
      const data = await response.json();
      if (data.success) {
        setKnowledgeObjects(data.data);
      }
    } catch (error) {
      console.error('Error loading knowledge objects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/airtable/sync', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        await loadSyncStatus();
        await loadAutoSyncStatus();
        await loadKnowledgeObjects();
      }
    } catch (error) {
      console.error('Error syncing Airtable:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleAutoSync = async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/airtable/auto-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          interval: autoSyncConfig.interval,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadAutoSyncStatus();
        setAutoSyncConfig(prev => ({ ...prev, enabled: action === 'start' }));
      }
    } catch (error) {
      console.error('Error controlling auto-sync:', error);
    }
  };

  const handleHumanReview = async () => {
    if (!humanReview.knowledgeObjectId || !humanReview.decision) return;

    try {
      const response = await fetch('/api/knowledge/human-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(humanReview),
      });

      const data = await response.json();
      if (data.success) {
        setHumanReview({ knowledgeObjectId: '', decision: '', comments: '' });
        await loadKnowledgeObjects();
        await loadSyncStatus();
      }
    } catch (error) {
      console.error('Error submitting human review:', error);
    }
  };

  const filteredObjects = knowledgeObjects.filter(obj => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      obj.content.toLowerCase().includes(query) ||
      obj.topic.toLowerCase().includes(query) ||
      obj.category.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'bg-green-100 text-green-800';
      case 'validated': return 'bg-blue-100 text-blue-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Airtable Knowledge Base
              </CardTitle>
              <CardDescription>
                Live regulatory knowledge synchronized from Airtable
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {autoSyncStatus?.isRunning ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  Auto-sync Active
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Auto-sync Inactive
                </div>
              )}
              <Button 
                onClick={handleSync} 
                disabled={syncing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {syncStatus && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{syncStatus.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{syncStatus.highConfidence}</div>
                <div className="text-sm text-muted-foreground">High Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{syncStatus.mediumConfidence}</div>
                <div className="text-sm text-muted-foreground">Medium Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{syncStatus.deployed}</div>
                <div className="text-sm text-muted-foreground">Deployed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{syncStatus.pendingReview}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{syncStatus.validated}</div>
                <div className="text-sm text-muted-foreground">Validated</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-sync Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auto-sync Configuration
          </CardTitle>
          <CardDescription>
            Configure automatic synchronization with Airtable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
              <Input
                id="sync-interval"
                type="number"
                min="5"
                max="1440"
                value={autoSyncConfig.interval}
                onChange={(e) => setAutoSyncConfig(prev => ({ 
                  ...prev, 
                  interval: parseInt(e.target.value) || 60 
                }))}
                disabled={autoSyncStatus?.isRunning}
              />
            </div>
            <div>
              <Label>Auto-sync Status</Label>
              <div className="flex items-center gap-2 mt-2">
                {autoSyncStatus?.isRunning ? (
                  <>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600">Running</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAutoSync('stop')}
                      className="flex items-center gap-1"
                    >
                      <Pause className="h-3 w-3" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">Stopped</span>
                    <Button
                      size="sm"
                      onClick={() => handleAutoSync('start')}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      Start
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div>
              <Label>Last Activity</Label>
              <div className="text-sm text-muted-foreground mt-2">
                {autoSyncStatus?.lastSync 
                  ? `Last sync: ${new Date(autoSyncStatus.lastSync).toLocaleString()}`
                  : 'No sync activity yet'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="knowledge-objects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="knowledge-objects">Knowledge Objects</TabsTrigger>
          <TabsTrigger value="human-review">Human Review</TabsTrigger>
          <TabsTrigger value="regulator-query">Regulator Query</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge-objects" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Knowledge Objects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Confidence</Label>
                  <Select 
                    value={filters.confidence} 
                    onValueChange={(value) => setFilters({...filters, confidence: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={filters.category} 
                    onValueChange={(value) => setFilters({...filters, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {syncStatus?.categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters({...filters, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="deployed">Deployed</SelectItem>
                      <SelectItem value="validated">Validated</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Objects List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">Loading knowledge objects...</div>
            ) : (
              filteredObjects.map((obj) => (
                <Card key={obj.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getConfidenceColor(obj.confidence)}>
                            {obj.confidence} Confidence
                          </Badge>
                          <Badge className={getStatusColor(obj.status)}>
                            {obj.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{obj.category}</Badge>
                        </div>
                        <CardTitle className="text-lg">{obj.topic}</CardTitle>
                        <CardDescription>
                          Airtable ID: {obj.airtableId} • Updated: {new Date(obj.lastUpdated).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedObject(obj)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {obj.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="human-review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Human Review Queue</CardTitle>
              <CardDescription>
                Review and approve medium-confidence knowledge objects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {knowledgeObjects
                  .filter(obj => obj.status === 'pending_review')
                  .map((obj) => (
                    <Card key={obj.id} className="border-yellow-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Pending Review
                              </Badge>
                              <Badge variant="outline">{obj.category}</Badge>
                            </div>
                            <CardTitle className="text-lg">{obj.topic}</CardTitle>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setHumanReview({
                                knowledgeObjectId: obj.id,
                                decision: 'approve',
                                comments: '',
                              })}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setHumanReview({
                                knowledgeObjectId: obj.id,
                                decision: 'reject',
                                comments: '',
                              })}
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {obj.content}
                        </p>
                        
                        {humanReview.knowledgeObjectId === obj.id && (
                          <div className="space-y-4 border-t pt-4">
                            <div>
                              <Label htmlFor="comments">Comments (Optional)</Label>
                              <Textarea
                                id="comments"
                                placeholder="Add your review comments..."
                                value={humanReview.comments}
                                onChange={(e) => setHumanReview({
                                  ...humanReview,
                                  comments: e.target.value,
                                })}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleHumanReview}
                                disabled={!humanReview.decision}
                              >
                                Submit Review
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setHumanReview({
                                  knowledgeObjectId: '',
                                  decision: '',
                                  comments: '',
                                })}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulator-query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulator Query Interface</CardTitle>
              <CardDescription>
                Query the knowledge base for regulatory compliance information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="query">Query</Label>
                  <Textarea
                    id="query"
                    placeholder="Enter your regulatory query..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {syncStatus?.categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Confidence</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="deployed">Deployed</SelectItem>
                        <SelectItem value="validated">Validated</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Execute Query
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Knowledge Object Detail Modal */}
      {selectedObject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedObject.topic}</CardTitle>
                  <CardDescription>
                    {selectedObject.category} • {selectedObject.confidence} Confidence
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedObject(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Badge className={getStatusColor(selectedObject.status)}>
                  {selectedObject.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <Label>Content</Label>
                <div className="mt-2 p-4 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedObject.content}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Airtable ID</Label>
                  <p className="text-muted-foreground">{selectedObject.airtableId}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-muted-foreground">
                    {new Date(selectedObject.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}