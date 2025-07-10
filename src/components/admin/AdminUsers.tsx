import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, UserCheck, Ban } from "lucide-react";
import { toast } from "sonner";
import { secureAdminService } from "@/services/secure-admin";

interface User {
  id: string;
  user_id: string;
  display_name: string | null;
  verified_wallet_address: string | null;
  vip_status: boolean | null;
  created_at: string;
}

interface AdminUsersProps {
  isAdmin: boolean;
}

export const AdminUsers = ({ isAdmin }: AdminUsersProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [chipAmount, setChipAmount] = useState(5);
  const [overAmount, setOverAmount] = useState(0);

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

  const updateUserBalance = async () => {
    if (!isAdmin || !selectedUserId) {
      toast.error("Please select a user first");
      return;
    }

    try {
      const success = await secureAdminService.updateUserBalance(
        selectedUserId, 
        chipAmount > 0 ? chipAmount : undefined,
        overAmount > 0 ? overAmount : undefined
      );
      
      if (success) {
        toast.success("User balance updated successfully");
        setSelectedUserId("");
        setChipAmount(5);
        setOverAmount(0);
        
        // Auto-refresh after successful update
        setTimeout(() => {
          loadUsers();
        }, 1000);
      } else {
        toast.error("Failed to update user balance");
      }
    } catch (error) {
      console.error('Balance update failed:', error);
      toast.error("Failed to update user balance");
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.verified_wallet_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-muted-foreground">Admin privileges required to manage users.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <Card className="p-6 bg-gradient-card border-primary">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-primary">User Management</h3>
            <p className="text-muted-foreground">Manage platform users and balances</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, wallet, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={loadUsers} disabled={loading} variant="outline">
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </Card>

      {/* Balance Update Form */}
      <Card className="p-6 bg-gradient-card">
        <h3 className="text-lg font-bold mb-4">Update User Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select User</label>
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Select a user...</option>
              {users.map(user => (
                <option key={user.id} value={user.user_id}>
                  {user.display_name || user.user_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Chips</label>
            <Input
              type="number"
              value={chipAmount}
              onChange={(e) => setChipAmount(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">OVER Amount</label>
            <Input
              type="number"
              value={overAmount}
              onChange={(e) => setOverAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button 
              onClick={updateUserBalance}
              disabled={!selectedUserId}
              className="flex-1"
            >
              Update Balance
            </Button>
            <Button 
              onClick={() => secureAdminService.forceRefreshBalances()}
              variant="outline"
              size="sm"
              title="Force refresh all balances"
            >
              Sync
            </Button>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Card className="p-6 bg-gradient-card">
        <h3 className="text-lg font-bold mb-4">
          Users ({filteredUsers.length})
        </h3>
        
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
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {user.display_name || "Unnamed User"}
                      </span>
                      {user.vip_status && (
                        <Badge variant="secondary">
                          <UserCheck className="h-3 w-3 mr-1" />
                          VIP
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>User ID: {user.user_id}</div>
                      <div>Wallet: {user.verified_wallet_address || 'Not verified'}</div>
                      <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};