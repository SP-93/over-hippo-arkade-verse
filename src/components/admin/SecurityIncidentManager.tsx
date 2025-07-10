import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Eye, Edit, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { complianceAuditService, SecurityIncident } from "@/services/compliance-audit";
import { toast } from "sonner";

export const SecurityIncidentManager: React.FC = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form state for creating new incidents
  const [newIncident, setNewIncident] = useState({
    incident_type: '',
    severity: 'medium',
    title: '',
    description: '',
    affected_user_id: '',
    status: 'open'
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    loadIncidents();
  }, [statusFilter, severityFilter]);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const result = await complianceAuditService.getSecurityIncidents(
        statusFilter === 'all' ? undefined : statusFilter,
        severityFilter === 'all' ? undefined : severityFilter
      );
      
      if (result.success) {
        setIncidents(result.data as SecurityIncident[]);
      } else {
        toast.error('Failed to load security incidents');
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Failed to load incidents');
    } finally {
      setIsLoading(false);
    }
  };

  const createIncident = async () => {
    if (!newIncident.title || !newIncident.incident_type) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const incidentData = {
        ...newIncident,
        incident_data: {
          created_manually: true,
          timestamp: new Date().toISOString()
        }
      };

      const result = await complianceAuditService.createSecurityIncident(incidentData);
      
      if (result.success) {
        toast.success('Security incident created successfully');
        setIsDialogOpen(false);
        setNewIncident({
          incident_type: '',
          severity: 'medium',
          title: '',
          description: '',
          affected_user_id: '',
          status: 'open'
        });
        loadIncidents();
      } else {
        toast.error('Failed to create incident');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Failed to create incident');
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: string, resolutionNotes?: string) => {
    try {
      const updates: Partial<SecurityIncident> = { 
        status: status,
        ...(status === 'resolved' && { resolved_at: new Date().toISOString() }),
        ...(resolutionNotes && { resolution_notes: resolutionNotes })
      };

      const result = await complianceAuditService.updateSecurityIncident(incidentId, updates);
      
      if (result.success) {
        toast.success('Incident updated successfully');
        loadIncidents();
      } else {
        toast.error('Failed to update incident');
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error('Failed to update incident');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case 'investigating':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Investigating
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <XCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case 'high_risk_behavior':
      case 'security_violation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security Incident Management</h2>
          <p className="text-muted-foreground">Monitor and manage security incidents</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Security Incident</DialogTitle>
              <DialogDescription>
                Manually create a new security incident for tracking
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incident_type">Incident Type</Label>
                  <Input
                    id="incident_type"
                    placeholder="e.g., unauthorized_access"
                    value={newIncident.incident_type}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, incident_type: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={newIncident.severity} onValueChange={(value) => setNewIncident(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the incident"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the incident"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="affected_user_id">Affected User ID (optional)</Label>
                <Input
                  id="affected_user_id"
                  placeholder="User ID if specific user is affected"
                  value={newIncident.affected_user_id}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, affected_user_id: e.target.value }))}
                />
              </div>
              
              <Button onClick={createIncident} className="w-full">
                Create Incident
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Severity Filter</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Incidents</CardTitle>
          <CardDescription>
            Current and historical security incidents requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No security incidents found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIncidentTypeIcon(incident.incident_type)}
                        <div>
                          <div className="font-medium">{incident.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {incident.incident_type}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{incident.incident_type}</TableCell>
                    <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell>
                      {incident.detected_at && format(new Date(incident.detected_at), "MMM dd, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIncident(incident);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {incident.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateIncidentStatus(incident.id!, 'investigating')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {(incident.status === 'investigating' || incident.status === 'open') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateIncidentStatus(incident.id!, 'resolved', 'Resolved by admin')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Incident Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Security Incident Details</DialogTitle>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity</Label>
                  <div className="mt-1">{getSeverityBadge(selectedIncident.severity)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedIncident.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Detected At</Label>
                  <p className="text-sm">
                    {selectedIncident.detected_at && format(new Date(selectedIncident.detected_at), "PPP HH:mm")}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm mt-1">{selectedIncident.title}</p>
              </div>
              
              {selectedIncident.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">{selectedIncident.description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Incident Data</Label>
                <pre className="text-xs bg-gray-50 p-3 rounded-md mt-1 overflow-auto">
                  {JSON.stringify(selectedIncident.incident_data, null, 2)}
                </pre>
              </div>
              
              {selectedIncident.resolution_notes && (
                <div>
                  <Label className="text-sm font-medium">Resolution Notes</Label>
                  <p className="text-sm mt-1">{selectedIncident.resolution_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};