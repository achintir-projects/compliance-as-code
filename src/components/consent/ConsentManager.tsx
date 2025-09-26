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
import { Calendar, Clock, Shield, FileText, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ConsentObject {
  id: string;
  knowledgeObjectId?: string;
  decisionBundleId?: string;
  consentType: 'DATA_PROCESSING' | 'DECISION_MAKING' | 'STORAGE' | 'SHARING' | 'ANALYTICS';
  purpose: string;
  legalBasis: string;
  retentionPeriod?: string;
  expiryDate?: string;
  isRevoked: boolean;
  revokedAt?: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  knowledgeObject?: {
    id: string;
    topic: string;
    category: string;
  };
  decisionBundle?: {
    id: string;
    agentId: string;
    timestamp: string;
  };
}

interface ConsentFormData {
  knowledgeObjectId?: string;
  decisionBundleId?: string;
  consentType: 'DATA_PROCESSING' | 'DECISION_MAKING' | 'STORAGE' | 'SHARING' | 'ANALYTICS';
  purpose: string;
  legalBasis: string;
  retentionPeriod?: string;
  expiryDate?: string;
  metadata?: any;
}

export function ConsentManager() {
  const [consents, setConsents] = useState<ConsentObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsent, setEditingConsent] = useState<ConsentObject | null>(null);
  const [formData, setFormData] = useState<ConsentFormData>({
    consentType: 'DATA_PROCESSING',
    purpose: '',
    legalBasis: '',
    retentionPeriod: '',
    expiryDate: '',
    metadata: {}
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConsents();
    fetchConsentStats();
  }, []);

  const fetchConsentStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/consent/stats');
      if (!response.ok) throw new Error('Failed to fetch consent stats');
      const data = await response.json();
      // Update the consent count in the overview if needed
      console.log('Consent stats:', data.stats);
    } catch (err) {
      console.error('Error fetching consent stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchConsents = async () => {
    try {
      setError(null);
      const response = await fetch('/api/consent/objects');
      if (!response.ok) throw new Error('Failed to fetch consents');
      const data = await response.json();
      setConsents(data.consents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = editingConsent 
        ? `/api/consent/objects/${editingConsent.id}`
        : '/api/consent/objects';
      
      const method = editingConsent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save consent');

      setSuccess(editingConsent ? 'Consent updated successfully' : 'Consent created successfully');
      setIsDialogOpen(false);
      setEditingConsent(null);
      setFormData({
        consentType: 'DATA_PROCESSING',
        purpose: '',
        legalBasis: '',
        retentionPeriod: '',
        expiryDate: '',
        metadata: {}
      });
      fetchConsents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleEdit = (consent: ConsentObject) => {
    setEditingConsent(consent);
    setFormData({
      knowledgeObjectId: consent.knowledgeObjectId,
      decisionBundleId: consent.decisionBundleId,
      consentType: consent.consentType,
      purpose: consent.purpose,
      legalBasis: consent.legalBasis,
      retentionPeriod: consent.retentionPeriod,
      expiryDate: consent.expiryDate,
      metadata: consent.metadata
    });
    setIsDialogOpen(true);
  };

  const handleRevoke = async (consentId: string) => {
    try {
      const response = await fetch(`/api/consent/objects/${consentId}/revoke`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to revoke consent');
      
      setSuccess('Consent revoked successfully');
      fetchConsents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const getConsentTypeColor = (type: string) => {
    const colors = {
      'DATA_PROCESSING': 'bg-blue-100 text-blue-800',
      'DECISION_MAKING': 'bg-green-100 text-green-800',
      'STORAGE': 'bg-yellow-100 text-yellow-800',
      'SHARING': 'bg-purple-100 text-purple-800',
      'ANALYTICS': 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const getRetentionDays = (retentionPeriod?: string) => {
    if (!retentionPeriod) return 'Unlimited';
    if (retentionPeriod.startsWith('P')) {
      const match = retentionPeriod.match(/P(\d+)([YMWD])/);
      if (match) {
        const [, value, unit] = match;
        const units = {
          'Y': 'years',
          'M': 'months',
          'W': 'weeks',
          'D': 'days'
        };
        return `${value} ${units[unit as keyof typeof units]}`;
      }
    }
    return retentionPeriod;
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
          <h2 className="text-2xl font-bold">Consent Management</h2>
          <p className="text-muted-foreground">
            Manage consent objects linked to knowledge objects and decision bundles
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingConsent(null)}>
              Create Consent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConsent ? 'Edit Consent' : 'Create Consent'}
              </DialogTitle>
              <DialogDescription>
                Configure consent settings with retention and expiry policies
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consentType">Consent Type</Label>
                  <Select
                    value={formData.consentType}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      consentType: value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DATA_PROCESSING">Data Processing</SelectItem>
                      <SelectItem value="DECISION_MAKING">Decision Making</SelectItem>
                      <SelectItem value="STORAGE">Storage</SelectItem>
                      <SelectItem value="SHARING">Sharing</SelectItem>
                      <SelectItem value="ANALYTICS">Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="legalBasis">Legal Basis</Label>
                  <Input
                    id="legalBasis"
                    value={formData.legalBasis}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      legalBasis: e.target.value 
                    }))}
                    placeholder="e.g., GDPR Article 6(1)(a)"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    purpose: e.target.value 
                  }))}
                  placeholder="Describe the purpose of this consent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retentionPeriod">Retention Period</Label>
                  <Input
                    id="retentionPeriod"
                    value={formData.retentionPeriod}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      retentionPeriod: e.target.value 
                    }))}
                    placeholder="e.g., P1Y (1 year), P6M (6 months)"
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      expiryDate: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="knowledgeObjectId">Knowledge Object ID (Optional)</Label>
                  <Input
                    id="knowledgeObjectId"
                    value={formData.knowledgeObjectId || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      knowledgeObjectId: e.target.value || undefined 
                    }))}
                    placeholder="Link to knowledge object"
                  />
                </div>
                <div>
                  <Label htmlFor="decisionBundleId">Decision Bundle ID (Optional)</Label>
                  <Input
                    id="decisionBundleId"
                    value={formData.decisionBundleId || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      decisionBundleId: e.target.value || undefined 
                    }))}
                    placeholder="Link to decision bundle"
                  />
                </div>
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
                  {editingConsent ? 'Update' : 'Create'}
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

      <Card>
        <CardHeader>
          <CardTitle>Consent Objects</CardTitle>
          <CardDescription>
            View and manage all consent objects with their retention and expiry policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Legal Basis</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consents.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell>
                    <Badge className={getConsentTypeColor(consent.consentType)}>
                      {consent.consentType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">{consent.purpose}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{consent.legalBasis}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {getRetentionDays(consent.retentionPeriod)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm ${isExpired(consent.expiryDate) ? 'text-red-600' : ''}`}>
                        {consent.expiryDate ? new Date(consent.expiryDate).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {consent.isRevoked ? (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">Revoked</span>
                        </>
                      ) : isExpired(consent.expiryDate) ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-600">Expired</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Active</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {consent.knowledgeObject && (
                        <div className="flex items-center space-x-1">
                          <span className="text-muted-foreground">KO:</span>
                          <span>{consent.knowledgeObject.topic}</span>
                        </div>
                      )}
                      {consent.decisionBundleId && (
                        <div className="flex items-center space-x-1">
                          <span className="text-muted-foreground">Bundle:</span>
                          <span>{consent.decisionBundleId.slice(0, 8)}...</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(consent)}
                        disabled={consent.isRevoked}
                      >
                        Edit
                      </Button>
                      {!consent.isRevoked && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(consent.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {consents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No consent objects found. Create your first consent to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}