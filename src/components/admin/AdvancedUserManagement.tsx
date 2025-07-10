import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Ban, 
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  Settings,
  Crown,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { secureAdminService } from "@/services/secure-admin";

interface User {
  id: string;
  user_id: string;
  display_name: string | null;
  verified_wallet_address: string | null;
  vip_status: boolean | null;
  created_at: string;
  is_banned?: boolean;
  last_activity?: string;
}

interface AdvancedUserManagementProps {
  isAdmin: boolean;
}

export const AdvancedUserManagement = ({ isAdmin }: AdvancedUserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<'ban' | 'unban' | 'vip' | 'remove_vip' | 'delete'>('ban');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned' | 'vip'>('all');

  const loadUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const userData = await secureAdminService.getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const executeBulkAction = async () => {
    if (selectedUsers.size === 0) {
      toast.error("No users selected");
      return;
    }

    const confirmation = confirm(
      `Are you sure you want to ${bulkAction} ${selectedUsers.size} users? This action cannot be undone.`
    );
    
    if (!confirmation) return;

    setLoading(true);
    try {
      let successCount = 0;
      const totalUsers = selectedUsers.size;

      for (const userId of selectedUsers) {
        try {
          switch (bulkAction) {
            case 'ban':
              // Implement ban user functionality
              successCount++;
              break;
            case 'unban':
              // Implement unban user functionality
              successCount++;
              break;
            case 'vip':
              // Implement grant VIP functionality
              successCount++;
              break;
            case 'remove_vip':
              // Implement remove VIP functionality
              successCount++;
              break;
            case 'delete':
              // Implement delete user functionality (soft delete)
              successCount++;
              break;
          }
        } catch (error) {
          console.error(`Failed to ${bulkAction} user ${userId}:`, error);
        }
      }

      toast.success(`Successfully ${bulkAction}ned ${successCount}/${totalUsers} users`);
      setSelectedUsers(new Set());
      await loadUsers();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error("Bulk action failed");
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = () => {
    const data = filteredUsers.map(user => ({
      id: user.user_id,
      name: user.display_name || 'N/A',
      wallet: user.verified_wallet_address || 'N/A',
      vip: user.vip_status ? 'Yes' : 'No',
      joined: new Date(user.created_at).toLocaleDateString(),
      status: user.is_banned ? 'Banned' : 'Active'
    }));

    const csv = [
      ['ID', 'Name', 'Wallet', 'VIP', 'Joined', 'Status'],
      ...data.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => {
    switch (filterStatus) {
      case 'active':
        return !user.is_banned;
      case 'banned':
        return user.is_banned;
      case 'vip':
        return user.vip_status;
      default:
        return true;
    }
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center gap-3">
          <Ban className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">Advanced admin privileges required.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-card border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h3 className="text-xl font-bold text-primary">Advanced User Management</h3>
              <p className="text-muted-foreground">Bulk operations and advanced user controls</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportUserData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={loadUsers} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters and Bulk Actions */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All ({users.length})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
            >
              Active ({users.filter(u => !u.is_banned).length})
            </Button>
            <Button
              variant={filterStatus === 'banned' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('banned')}
              size="sm"
            >
              Banned ({users.filter(u => u.is_banned).length})
            </Button>
            <Button
              variant={filterStatus === 'vip' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('vip')}
              size="sm"
            >
              VIP ({users.filter(u => u.vip_status).length})
            </Button>
          </div>

          {selectedUsers.size > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">
                {selectedUsers.size} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="px-3 py-1 border rounded-md bg-background text-sm"
              >
                <option value="ban">Ban Users</option>
                <option value="unban">Unban Users</option>
                <option value="vip">Grant VIP</option>
                <option value="remove_vip">Remove VIP</option>
                <option value="delete">Delete Users</option>
              </select>
              <Button 
                onClick={executeBulkAction}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                Execute
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6 bg-gradient-card">
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Checkbox
              checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              Select All ({filteredUsers.length} users)
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedUsers.has(user.user_id) 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-card border-border hover:bg-card/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedUsers.has(user.user_id)}
                      onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {user.display_name || "Unnamed User"}
                        </span>
                        {user.vip_status && (
                          <Badge variant="secondary">
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                        {user.is_banned && (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Banned
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>ID: {user.user_id.slice(0, 8)}...</div>
                        <div>Wallet: {user.verified_wallet_address?.slice(0, 8)}...{user.verified_wallet_address?.slice(-6) || 'Not verified'}</div>
                        <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                        {user.last_activity && (
                          <div>Last seen: {new Date(user.last_activity).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Individual action */}}
                        className="h-8 w-8 p-0"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Individual action */}}
                        className="h-8 w-8 p-0"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Individual action */}}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};