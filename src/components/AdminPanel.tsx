import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Settings, Wallet, Users, TrendingUp, Download, DollarSign, Trophy, Database, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ADMIN_WALLET = "0x88d26e867b289AD2e63A0BE905f9BC803A64F37f";

interface AdminPanelProps {
  walletAddress: string;
  isVisible: boolean;
}

interface PlatformStats {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  activeTournaments: number;
  totalChipsInCirculation: number;
}

interface UserData {
  id: string;
  user_id: string;
  display_name: string;
  wallet_address: string;
  total_chips: number;
  over_balance: number;
  created_at: string;
}

interface TransactionData {
  id: string;
  user_id: string;
  transaction_type: string;
  chip_amount: number;
  over_amount: number;
  status: string;
  created_at: string;
  profiles: {
    display_name: string;
    wallet_address: string;
  };
}

export const AdminPanel = ({ walletAddress, isVisible }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const queryClient = useQueryClient();

  // Fetch platform statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      const [usersResult, transactionsResult, tournamentsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('chip_transactions').select('chip_amount, over_amount'),
        supabase.from('tournaments').select('*', { count: 'exact' }).eq('status', 'active')
      ]);

      const totalUsers = usersResult.count || 0;
      const totalRevenue = transactionsResult.data?.reduce((sum, t) => sum + (t.over_amount || 0), 0) || 0;
      const totalTransactions = transactionsResult.data?.length || 0;
      const activeTournaments = tournamentsResult.count || 0;
      
      const chipsResult = await supabase.from('profiles').select('total_chips');
      const totalChipsInCirculation = chipsResult.data?.reduce((sum, p) => sum + (p.total_chips || 0), 0) || 0;

      return {
        totalUsers,
        totalRevenue,
        totalTransactions,
        activeTournaments,
        totalChipsInCirculation
      };
    },
    enabled: isVisible
  });

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserData[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isVisible && activeTab === 'users'
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async (): Promise<TransactionData[]> => {
      const { data, error } = await supabase
        .from('chip_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Fetch user profiles for each transaction
      const transactionsWithProfiles = await Promise.all(
        (data || []).map(async (tx) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, wallet_address')
            .eq('user_id', tx.user_id)
            .single();
          
          return {
            ...tx,
            profiles: profile || { display_name: 'Unknown', wallet_address: 'Unknown' }
          };
        })
      );
      
      return transactionsWithProfiles;
    },
    enabled: isVisible && activeTab === 'transactions'
  });

  // Withdraw to admin wallet mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      // This would normally call an edge function to handle withdrawal
      // For now, we'll just record the transaction
      const { error } = await supabase
        .from('chip_transactions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          transaction_type: 'admin_withdrawal',
          chip_amount: 0,
          over_amount: amount,
          status: 'completed'
        });
      
      if (error) throw error;
      return amount;
    },
    onSuccess: (amount) => {
      toast.success(`Successfully withdrew ${amount} OVER to admin wallet`);
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setWithdrawAmount("");
    },
    onError: (error) => {
      toast.error(`Withdrawal failed: ${error.message}`);
    }
  });

  // Update user balance mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, chips, over }: { userId: string, chips?: number, over?: number }) => {
      const updates: any = {};
      if (chips !== undefined) updates.total_chips = chips;
      if (over !== undefined) updates.over_balance = over;
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User balance updated successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="p-6 bg-gradient-card border-destructive shadow-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-destructive animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold text-destructive">Admin Panel</h2>
              <p className="text-sm text-muted-foreground">Platform Management Interface</p>
              <p className="text-xs text-muted-foreground">Admin Wallet: {ADMIN_WALLET}</p>
            </div>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            ADMIN ACCESS
          </Badge>
        </div>
      </Card>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-card border-neon-blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-neon-blue">
                    {statsLoading ? '...' : stats?.totalUsers || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <Users className="h-8 w-8 text-neon-blue" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-neon-green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-neon-green">
                    {statsLoading ? '...' : `${stats?.totalRevenue || 0} OVER`}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <DollarSign className="h-8 w-8 text-neon-green" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-neon-pink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-neon-pink">
                    {statsLoading ? '...' : stats?.totalTransactions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
                <TrendingUp className="h-8 w-8 text-neon-pink" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-arcade-gold">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-arcade-gold">
                    {statsLoading ? '...' : stats?.activeTournaments || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Tournaments</p>
                </div>
                <Trophy className="h-8 w-8 text-arcade-gold" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {statsLoading ? '...' : stats?.totalChipsInCirculation || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Chips in Circulation</p>
                </div>
                <Database className="h-8 w-8 text-primary" />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Management
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
                disabled={usersLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-auto">
              {usersLoading ? (
                <p className="text-center text-muted-foreground">Loading users...</p>
              ) : users?.map((user) => (
                <Card key={user.id} className="p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{user.display_name || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">{user.wallet_address || 'No wallet'}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.total_chips} Chips</p>
                        <p className="text-sm text-neon-green">{user.over_balance} OVER</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const newChips = prompt(`Current chips: ${user.total_chips}. Enter new amount:`);
                            if (newChips && !isNaN(Number(newChips))) {
                              updateUserMutation.mutate({ userId: user.user_id, chips: Number(newChips) });
                            }
                          }}
                        >
                          Edit Chips
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const newOver = prompt(`Current OVER: ${user.over_balance}. Enter new amount:`);
                            if (newOver && !isNaN(Number(newOver))) {
                              updateUserMutation.mutate({ userId: user.user_id, over: Number(newOver) });
                            }
                          }}
                        >
                          Edit OVER
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Recent Transactions
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-transactions'] })}
                disabled={transactionsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${transactionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-auto">
              {transactionsLoading ? (
                <p className="text-center text-muted-foreground">Loading transactions...</p>
              ) : transactions?.map((tx) => (
                <Card key={tx.id} className="p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {tx.profiles?.display_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.transaction_type} • {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{tx.chip_amount} Chips</p>
                      <p className="text-sm text-neon-green">{tx.over_amount || 0} OVER</p>
                      <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tournaments Tab */}
        <TabsContent value="tournaments" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Tournament Management
            </h3>
            <p className="text-muted-foreground mb-4">Create and manage gaming tournaments</p>
            <Button variant="outline" disabled>
              Create Tournament (Coming Soon)
            </Button>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Financial Management
            </h3>
            
            <div className="space-y-6">
              {/* Platform Revenue */}
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2">Platform Revenue</h4>
                <p className="text-2xl font-bold text-neon-green">
                  {stats?.totalRevenue || 0} OVER
                </p>
                <p className="text-sm text-muted-foreground">Total revenue from all platform activities</p>
              </div>

              {/* Withdrawal Section */}
              <div className="p-4 border border-destructive/20 rounded-lg">
                <h4 className="font-medium mb-4 text-destructive">Withdraw to Admin Wallet</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount">Amount (OVER)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount to withdraw"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-muted-foreground">
                      Funds will be sent to: {ADMIN_WALLET}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const amount = parseFloat(withdrawAmount);
                      if (amount > 0) {
                        withdrawMutation.mutate(amount);
                      } else {
                        toast.error("Please enter a valid amount");
                      }
                    }}
                    disabled={!withdrawAmount || withdrawMutation.isPending}
                  >
                    {withdrawMutation.isPending ? 'Processing...' : 'Withdraw Funds'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Platform Settings
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2">Admin Wallet Configuration</h4>
                <p className="text-sm text-muted-foreground mb-2">Current admin wallet:</p>
                <code className="text-xs bg-background p-2 rounded block">{ADMIN_WALLET}</code>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2">Platform Status</h4>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};