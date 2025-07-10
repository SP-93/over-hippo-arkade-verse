import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Clock,
  User,
  Ban,
  CheckCircle,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface PrivilegeEvent {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  from_role: string;
  to_role: string;
  timestamp: string;
  ip_address: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'denied' | 'auto_approved';
  approver?: string;
  reason?: string;
}

interface PrivilegeEscalationMonitorProps {
  isAdmin: boolean;
}

export const PrivilegeEscalationMonitor = ({ isAdmin }: PrivilegeEscalationMonitorProps) => {
  const [events, setEvents] = useState<PrivilegeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high_risk'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  const loadPrivilegeEvents = async () => {
    setLoading(true);
    try {
      // Simulate loading privilege escalation events
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEvents: PrivilegeEvent[] = [
        {
          id: '1',
          user_id: 'user123',
          user_name: 'john.doe@example.com',
          action: 'role_elevation',
          from_role: 'user',
          to_role: 'moderator',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100',
          risk_level: 'medium',
          status: 'pending'
        },
        {
          id: '2',
          user_id: 'user456',
          user_name: 'admin.user@example.com',
          action: 'permission_grant',
          from_role: 'moderator',
          to_role: 'admin',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ip_address: '10.0.0.50',
          risk_level: 'high',
          status: 'pending',
          reason: 'Emergency escalation required'
        },
        {
          id: '3',
          user_id: 'user789',
          user_name: 'temp.admin@example.com',
          action: 'temporary_access',
          from_role: 'user',
          to_role: 'admin',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          ip_address: '172.16.0.25',
          risk_level: 'critical',
          status: 'denied',
          approver: 'super.admin@example.com'
        }
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load privilege events:', error);
      toast.error("Failed to load privilege events");
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (eventId: string) => {
    try {
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, status: 'approved', approver: 'current.admin@example.com' }
          : event
      ));
      toast.success("Privilege request approved");
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error("Failed to approve request");
    }
  };

  const denyRequest = async (eventId: string) => {
    try {
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, status: 'denied', approver: 'current.admin@example.com' }
          : event
      ));
      toast.success("Privilege request denied");
    } catch (error) {
      console.error('Failed to deny request:', error);
      toast.error("Failed to deny request");
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500 border-green-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'high': return 'text-orange-500 border-orange-500';
      case 'critical': return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'approved': return 'text-green-500';
      case 'denied': return 'text-red-500';
      case 'auto_approved': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && event.status === 'pending') ||
      (filter === 'high_risk' && ['high', 'critical'].includes(event.risk_level));
    
    const matchesSearch = !searchTerm || 
      event.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    if (isAdmin) {
      loadPrivilegeEvents();
      // Set up auto-refresh every 2 minutes for real-time monitoring
      const interval = setInterval(loadPrivilegeEvents, 120000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center gap-3">
          <Ban className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">Privilege escalation monitoring requires admin access.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-card border-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="text-xl font-bold text-red-500">Privilege Escalation Monitor</h3>
              <p className="text-muted-foreground">Real-time monitoring of privilege changes and access requests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-red-500 text-red-500">
              {events.filter(e => e.status === 'pending').length} Pending
            </Badge>
            <Button onClick={loadPrivilegeEvents} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 bg-gradient-card">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All Events ({events.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              size="sm"
            >
              Pending ({events.filter(e => e.status === 'pending').length})
            </Button>
            <Button
              variant={filter === 'high_risk' ? 'default' : 'outline'}
              onClick={() => setFilter('high_risk')}
              size="sm"
            >
              High Risk ({events.filter(e => ['high', 'critical'].includes(e.risk_level)).length})
            </Button>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Events List */}
      <Card className="p-6 bg-gradient-card">
        <h3 className="text-lg font-bold mb-4">
          Privilege Events ({filteredEvents.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No privilege events found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className={`p-4 border-l-4 ${getRiskColor(event.risk_level)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{event.user_name}</span>
                      <Badge variant="outline" className={getRiskColor(event.risk_level)}>
                        {event.risk_level.toUpperCase()} RISK
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Action: {event.action}</span>
                        <span>From: {event.from_role} → To: {event.to_role}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        <span>IP: {event.ip_address}</span>
                      </div>
                      {event.reason && (
                        <div className="text-blue-400">Reason: {event.reason}</div>
                      )}
                      {event.approver && (
                        <div className="text-green-400">Approver: {event.approver}</div>
                      )}
                    </div>
                  </div>
                  
                  {event.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => approveRequest(event.id)}
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-500/10"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => denyRequest(event.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};