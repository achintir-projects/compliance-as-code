'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';

interface SecurityConfig {
  quantumResistantEnabled: boolean;
  encryptionEnabled: boolean;
  keyRotationEnabled: boolean;
  auditLogEnabled: boolean;
  mfaEnabled: boolean;
}

interface SecurityStatus {
  overall: 'SECURE' | 'WARNING' | 'CRITICAL';
  encryption: boolean;
  quantumResistance: boolean;
  keyManagement: boolean;
  auditLogging: boolean;
  accessControl: boolean;
  compliance: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'AUTHENTICATION' | 'ENCRYPTION' | 'KEY_MANAGEMENT' | 'ACCESS_CONTROL' | 'COMPLIANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export function SecurityManager() {
  const [config, setConfig] = useState<SecurityConfig>({
    quantumResistantEnabled: true,
    encryptionEnabled: true,
    keyRotationEnabled: true,
    auditLogEnabled: true,
    mfaEnabled: true
  });
  
  const [status, setStatus] = useState<SecurityStatus>({
    overall: 'SECURE',
    encryption: true,
    quantumResistance: true,
    keyManagement: true,
    auditLogging: true,
    accessControl: true,
    compliance: true
  });
  
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    fetchSecurityStatus();
    fetchSecurityEvents();
  }, []);

  const fetchSecurityStatus = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        overall: 'SECURE',
        encryption: true,
        quantumResistance: true,
        keyManagement: true,
        auditLogging: true,
        accessControl: true,
        compliance: true
      });
    } catch (error) {
      console.error('Error fetching security status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    // Simulate security events
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'AUTHENTICATION',
        severity: 'MEDIUM',
        description: 'MFA enabled for new user',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        resolved: true
      },
      {
        id: '2',
        type: 'ENCRYPTION',
        severity: 'LOW',
        description: 'Quantum-resistant encryption key rotated',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        resolved: true
      },
      {
        id: '3',
        type: 'KEY_MANAGEMENT',
        severity: 'HIGH',
        description: 'Suspicious key access attempt detected',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        resolved: false
      },
      {
        id: '4',
        type: 'COMPLIANCE',
        severity: 'MEDIUM',
        description: 'Compliance scan completed',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        resolved: true
      }
    ];
    
    setEvents(mockEvents);
  };

  const handleConfigChange = (key: keyof SecurityConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'LOW': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: SecurityStatus['overall']) => {
    switch (status) {
      case 'SECURE': return 'text-green-600';
      case 'WARNING': return 'text-yellow-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const generateNewKey = async () => {
    setIsLoading(true);
    try {
      // Simulate key generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add security event
      const newEvent: SecurityEvent = {
        id: Date.now().toString(),
        type: 'KEY_MANAGEMENT',
        severity: 'MEDIUM',
        description: 'New quantum-resistant encryption key generated',
        timestamp: new Date(),
        resolved: true
      };
      
      setEvents(prev => [newEvent, ...prev]);
    } catch (error) {
      console.error('Error generating key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rotateKeys = async () => {
    setIsLoading(true);
    try {
      // Simulate key rotation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add security event
      const newEvent: SecurityEvent = {
        id: Date.now().toString(),
        type: 'KEY_MANAGEMENT',
        severity: 'MEDIUM',
        description: 'Encryption keys rotated successfully',
        timestamp: new Date(),
        resolved: true
      };
      
      setEvents(prev => [newEvent, ...prev]);
    } catch (error) {
      console.error('Error rotating keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Management</h2>
          <p className="text-muted-foreground">Manage quantum-resistant security and compliance</p>
        </div>
        <Button onClick={fetchSecurityStatus} disabled={isLoading}>
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
          Refresh Status
        </Button>
      </div>

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Overall security posture and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Overall Status</p>
                <p className={`text-lg font-bold ${getStatusColor(status.overall)}`}>
                  {status.overall}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Encryption</p>
                <p className="text-lg font-bold text-green-600">
                  {status.encryption ? 'Active' : 'Inactive'}
                </p>
              </div>
              {getStatusIcon(status.encryption)}
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Quantum Resistance</p>
                <p className="text-lg font-bold text-green-600">
                  {status.quantumResistance ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {getStatusIcon(status.quantumResistance)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="key-management">Key Management</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Configure security settings and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Quantum-Resistant Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable CRYSTALS-Kyber and CRYSTALS-Dilithium algorithms
                    </p>
                  </div>
                  <Switch
                    checked={config.quantumResistantEnabled}
                    onCheckedChange={(checked) => handleConfigChange('quantumResistantEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>End-to-End Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt all data at rest and in transit
                    </p>
                  </div>
                  <Switch
                    checked={config.encryptionEnabled}
                    onCheckedChange={(checked) => handleConfigChange('encryptionEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Key Rotation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically rotate encryption keys
                    </p>
                  </div>
                  <Switch
                    checked={config.keyRotationEnabled}
                    onCheckedChange={(checked) => handleConfigChange('keyRotationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all security events and access attempts
                    </p>
                  </div>
                  <Switch
                    checked={config.auditLogEnabled}
                    onCheckedChange={(checked) => handleConfigChange('auditLogEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Multi-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require MFA for all administrative access
                    </p>
                  </div>
                  <Switch
                    checked={config.mfaEnabled}
                    onCheckedChange={(checked) => handleConfigChange('mfaEnabled', checked)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="key-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encryption Key Management</CardTitle>
              <CardDescription>
                Manage quantum-resistant encryption keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Encryption Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKeys ? 'text' : 'password'}
                      value="kyber-1024-primary-key-abc123..."
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeys(!showKeys)}
                    >
                      {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Backup Encryption Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKeys ? 'text' : 'password'}
                      value="kyber-1024-backup-key-def456..."
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKeys(!showKeys)}
                    >
                      {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={generateNewKey} disabled={isLoading}>
                  <Key className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
                <Button variant="outline" onClick={rotateKeys} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rotate Keys
                </Button>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Key rotation will temporarily affect system availability. 
                  Schedule during maintenance windows.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Recent security events and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="text-sm font-medium">
                          {event.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.resolved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={event.resolved ? 'default' : 'destructive'}>
                        {event.resolved ? 'Resolved' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>
                Regulatory compliance and audit status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Financial Regulations</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GDPR</span>
                      {getStatusIcon(true)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CCPA</span>
                      {getStatusIcon(true)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SOC 2</span>
                      {getStatusIcon(true)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ISO 27001</span>
                      {getStatusIcon(true)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Security Standards</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">NIST CSF</span>
                      {getStatusIcon(true)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CIS Controls</span>
                      {getStatusIcon(true)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">PCI DSS</span>
                      {getStatusIcon(true)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">HIPAA</span>
                      {getStatusIcon(true)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Next Audit</h4>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quarterly Security Audit</p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled for March 15, 2024
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}