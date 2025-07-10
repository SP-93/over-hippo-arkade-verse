import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle, XCircle, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuditLogEntry {
  id: string;
  admin_wallet_address: string;
  action_type: string;
  target_wallet_address: string | null;
  action_details: any;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

interface AdminAuditLogProps {
  isAdmin: boolean;
}

export const AdminAuditLog = ({ isAdmin }: AdminAuditLogProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const loadAuditLogs = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_audit_logs', {
        p_limit: 50,
        p_offset: 0
      });

      if (error) {
        console.error('Failed to load audit logs:', error);
        toast.error("Failed to load audit logs: " + error.message);
        return;
      }

      setAuditLogs(data || []);
      toast.success("Audit logs loaded successfully");
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error("Error loading audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAuditLogs();
    }
  }, [isAdmin]);

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'chip_grant_self':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'admin_check':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'balance_update':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'user_ban':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'withdrawal':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filter === 'success') return log.success;
    if (filter === 'failed') return !log.success;
    return true;
  });

  if (!isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center gap-3">
          <XCircle className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">You need admin privileges to view audit logs.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card border-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-bold text-primary">Admin Audit Log</h3>
              <p className="text-muted-foreground">Complete trail of all admin actions</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({auditLogs.length})
            </Button>
            <Button
              variant={filter === 'success' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('success')}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Success ({auditLogs.filter(l => l.success).length})
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('failed')}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Failed ({auditLogs.filter(l => !l.success).length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAuditLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card 
                  key={log.id} 
                  className={`p-4 ${log.success ? 'bg-card' : 'bg-destructive/5 border-destructive/20'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={getActionTypeColor(log.action_type)}
                        >
                          {formatActionType(log.action_type)}
                        </Badge>
                        
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">Admin:</span> 
                          <span className="font-mono text-xs ml-1">
                            {log.admin_wallet_address.slice(0, 6)}...{log.admin_wallet_address.slice(-4)}
                          </span>
                        </div>
                        
                        {log.target_wallet_address && (
                          <div>
                            <span className="font-medium">Target:</span>
                            <span className="font-mono text-xs ml-1">
                              {log.target_wallet_address.slice(0, 6)}...{log.target_wallet_address.slice(-4)}
                            </span>
                          </div>
                        )}
                        
                        {log.action_details && (
                          <div>
                            <span className="font-medium">Details:</span>
                            <div className="bg-muted/50 p-2 rounded text-xs font-mono mt-1">
                              {JSON.stringify(log.action_details, null, 2)}
                            </div>
                          </div>
                        )}
                        
                        {!log.success && log.error_message && (
                          <div>
                            <span className="font-medium text-destructive">Error:</span>
                            <span className="text-destructive text-xs ml-1">
                              {log.error_message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};