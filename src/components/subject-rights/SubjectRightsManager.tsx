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
import { 
  User, 
  FileText, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  Scale,
  Gavel
} from 'lucide-react';

interface SubjectRightsRequest {
  id: string;
  requestType: 'ACCESS_REQUEST' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICT_PROCESSING' | 'DATA_PORTABILITY' | 'OBJECT_AUTOMATED' | 'CCPA_DELETE' | 'CCPA_OPT_OUT' | 'LGPD_ACCESS' | 'LGPD_DELETE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'ESCALATED' | 'EXPIRED';
  requestedBy: string;
  requestData: any;
  response?: any;
  legalBasis: string;
  jurisdiction?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  completedAt?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  consentObjects?: Array<{
    id: string;
    consentType: string;
    purpose: string;
    isRevoked: boolean;
  }>;
  dataErasureLogs?: Array<{
    id: string;
    resourceType: string;
    erasureMethod: string;
    erasedAt: string;
  }>;
  dataRectificationLogs?: Array<{
    id: string;
    resourceType: string;
    changeReason: string;
    rectifiedAt: string;
  }>;
}

interface SubjectRightsFormData {
  requestType: 'ACCESS_REQUEST' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICT_PROCESSING' | 'DATA_PORTABILITY' | 'OBJECT_AUTOMATED' | 'CCPA_DELETE' | 'CCPA_OPT_OUT' | 'LGPD_ACCESS' | 'LGPD_DELETE';
  requestedBy: string;
  requestData: any;
  legalBasis: string;
  jurisdiction?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  metadata?: any;
}

export function SubjectRightsManager() {
  const [requests, setRequests] = useState<SubjectRightsRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SubjectRightsRequest | null>(null);
  const [formData, setFormData] = useState<SubjectRightsFormData>({
    requestType: 'ACCESS_REQUEST',
    requestedBy: '',
    requestData: {},
    legalBasis: '',
    jurisdiction: '',
    priority: 'MEDIUM',
    dueDate: '',
    metadata: {}
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/subject-rights/requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/subject-rights/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/subject-rights/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create request');

      setSuccess('Subject rights request created successfully');
      setIsDialogOpen(false);
      setFormData({
        requestType: 'ACCESS_REQUEST',
        requestedBy: '',
        requestData: {},
        legalBasis: '',
        jurisdiction: '',
        priority: 'MEDIUM',
        dueDate: '',
        metadata: {}
      });
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const processRequest = async (requestId: string, action: string) => {
    try {
      let response;
      switch (action) {
        case 'process_access':
          response = await fetch(`/api/subject-rights/requests/${requestId}/process-access`, {
            method: 'POST',
          });
          break;
        case 'process_erasure':
          response = await fetch(`/api/subject-rights/requests/${requestId}/process-erasure`, {
            method: 'POST',
          });
          break;
        default:
          throw new Error('Unknown action');
      }

      if (!response.ok) throw new Error('Failed to process request');

      setSuccess(`Request processed successfully`);
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const getRequestTypeColor = (type: string) => {
    const colors = {
      'ACCESS_REQUEST': 'bg-blue-100 text-blue-800',
      'RECTIFICATION': 'bg-yellow-100 text-yellow-800',
      'ERASURE': 'bg-red-100 text-red-800',
      'RESTRICT_PROCESSING': 'bg-purple-100 text-purple-800',
      'DATA_PORTABILITY': 'bg-green-100 text-green-800',
      'OBJECT_AUTOMATED': 'bg-orange-100 text-orange-800',
      'CCPA_DELETE': 'bg-pink-100 text-pink-800',
      'CCPA_OPT_OUT': 'bg-indigo-100 text-indigo-800',
      'LGPD_ACCESS': 'bg-teal-100 text-teal-800',
      'LGPD_DELETE': 'bg-cyan-100 text-cyan-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'ESCALATED': 'bg-orange-100 text-orange-800',
      'EXPIRED': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      'ACCESS_REQUEST': 'Access Request',
      'RECTIFICATION': 'Rectification',
      'ERASURE': 'Right to be Forgotten',
      'RESTRICT_PROCESSING': 'Restrict Processing',
      'DATA_PORTABILITY': 'Data Portability',
      'OBJECT_AUTOMATED': 'Object to Automated',
      'CCPA_DELETE': 'CCPA Delete',
      'CCPA_OPT_OUT': 'CCPA Opt Out',
      'LGPD_ACCESS': 'LGPD Access',
      'LGPD_DELETE': 'LGPD Delete'
    };
    return labels[type as keyof typeof labels] || type;
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
          <h2 className="text-2xl font-bold">Subject Rights Management</h2>
          <p className="text-muted-foreground">
            Manage GDPR, CCPA, and LGPD subject rights requests (access, rectification, erasure)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              Create Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Subject Rights Request</DialogTitle>
              <DialogDescription>
                Submit a new subject rights request for access, rectification, or erasure of personal data
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requestType">Request Type</Label>
                  <Select
                    value={formData.requestType}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      requestType: value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCESS_REQUEST">Access Request (GDPR)</SelectItem>
                      <SelectItem value="RECTIFICATION">Rectification (GDPR)</SelectItem>
                      <SelectItem value="ERASURE">Right to be Forgotten (GDPR)</SelectItem>
                      <SelectItem value="RESTRICT_PROCESSING">Restrict Processing (GDPR)</SelectItem>
                      <SelectItem value="DATA_PORTABILITY">Data Portability (GDPR)</SelectItem>
                      <SelectItem value="OBJECT_AUTOMATED">Object to Automated (GDPR)</SelectItem>
                      <SelectItem value="CCPA_DELETE">Delete Request (CCPA)</SelectItem>
                      <SelectItem value="CCPA_OPT_OUT">Opt Out (CCPA)</SelectItem>
                      <SelectItem value="LGPD_ACCESS">Access Request (LGPD)</SelectItem>
                      <SelectItem value="LGPD_DELETE">Delete Request (LGPD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      priority: value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requestedBy">Requested By</Label>
                  <Input
                    id="requestedBy"
                    value={formData.requestedBy}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      requestedBy: e.target.value 
                    }))}
                    placeholder="User email or ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="legalBasis">Legal Basis</Label>
                  <Select
                    value={formData.legalBasis}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      legalBasis: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GDPR Article 15">GDPR Article 15 (Access)</SelectItem>
                      <SelectItem value="GDPR Article 16">GDPR Article 16 (Rectification)</SelectItem>
                      <SelectItem value="GDPR Article 17">GDPR Article 17 (Erasure)</SelectItem>
                      <SelectItem value="CCPA Section 1798.130">CCPA Section 1798.130 (Delete)</SelectItem>
                      <SelectItem value="LGPD Article 18">LGPD Article 18 (Access)</SelectItem>
                      <SelectItem value="LGPD Article 19">LGPD Article 19 (Delete)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Select
                    value={formData.jurisdiction}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      jurisdiction: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GDPR">GDPR (EU)</SelectItem>
                      <SelectItem value="CCPA">CCPA (California)</SelectItem>
                      <SelectItem value="LGPD">LGPD (Brazil)</SelectItem>
                      <SelectItem value="PIPEDA">PIPEDA (Canada)</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      dueDate: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="requestData">Request Details</Label>
                <Textarea
                  id="requestData"
                  value={JSON.stringify(formData.requestData, null, 2)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, requestData: data }));
                    } catch {
                      // Invalid JSON, but we'll let the user continue typing
                    }
                  }}
                  placeholder="JSON format for request-specific data"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Rights Requests</CardTitle>
          <CardDescription>
            View and manage all subject rights requests with their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Badge className={getRequestTypeColor(request.requestType)}>
                      {getRequestTypeLabel(request.requestType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.requestedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      {isOverdue(request.dueDate) && request.status !== 'COMPLETED' && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm ${isOverdue(request.dueDate) && request.status !== 'COMPLETED' ? 'text-red-600' : ''}`}>
                        {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Gavel className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.jurisdiction || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {request.status === 'PENDING' && (
                        <>
                          {request.requestType === 'ACCESS_REQUEST' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processRequest(request.id, 'process_access')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Process
                            </Button>
                          )}
                          {request.requestType === 'ERASURE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => processRequest(request.id, 'process_erasure')}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Process
                            </Button>
                          )}
                        </>
                      )}
                      {request.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No subject rights requests found. Create your first request to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Full details and processing information for this subject rights request
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Request Type</Label>
                    <p className="text-sm font-medium">
                      {getRequestTypeLabel(selectedRequest.requestType)}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label>Requested By</Label>
                    <p className="text-sm font-medium">{selectedRequest.requestedBy}</p>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Badge className={getPriorityColor(selectedRequest.priority)}>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label>Legal Basis</Label>
                    <p className="text-sm font-medium">{selectedRequest.legalBasis}</p>
                  </div>
                  <div>
                    <Label>Jurisdiction</Label>
                    <p className="text-sm font-medium">{selectedRequest.jurisdiction || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <p className={`text-sm font-medium ${isOverdue(selectedRequest.dueDate) && selectedRequest.status !== 'COMPLETED' ? 'text-red-600' : ''}`}>
                      {selectedRequest.dueDate ? new Date(selectedRequest.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label>Request Data</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedRequest.requestData, null, 2)}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="response" className="space-y-4">
                {selectedRequest.response ? (
                  <div>
                    <Label>Response Data</Label>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                      {JSON.stringify(selectedRequest.response, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No response data available</p>
                )}
              </TabsContent>
              
              <TabsContent value="logs" className="space-y-4">
                {selectedRequest.dataErasureLogs && selectedRequest.dataErasureLogs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Data Erasure Logs</h4>
                    <div className="space-y-2">
                      {selectedRequest.dataErasureLogs.map((log) => (
                        <div key={log.id} className="text-sm border rounded p-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.resourceType}</span>
                            <span className="text-muted-foreground">{log.erasureMethod}</span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(log.erasedAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedRequest.dataRectificationLogs && selectedRequest.dataRectificationLogs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Data Rectification Logs</h4>
                    <div className="space-y-2">
                      {selectedRequest.dataRectificationLogs.map((log) => (
                        <div key={log.id} className="text-sm border rounded p-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{log.resourceType}</span>
                            <span className="text-muted-foreground">{log.changeReason}</span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {new Date(log.rectifiedAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!selectedRequest.dataErasureLogs?.length && !selectedRequest.dataRectificationLogs?.length && (
                  <p className="text-muted-foreground">No processing logs available</p>
                )}
              </TabsContent>
              
              <TabsContent value="audit" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Audit trail information would be displayed here, including all actions taken on this request.
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}