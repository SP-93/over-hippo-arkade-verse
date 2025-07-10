import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Settings, Wallet, Users, TrendingUp, Download, DollarSign, Trophy, Database, AlertTriangle, RefreshCw, Search } from "lucide-react";
import { BlockchainBalanceChecker } from "./BlockchainBalanceChecker";
import { WalletAdminPanel } from "./WalletAdminPanel";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminUsers } from "./admin/AdminUsers";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { secureAdminService, AdminStats } from "@/services/secure-admin";
import { supabase } from "@/integrations/supabase/client";

interface AdminPanelProps {
  walletAddress: string;
  isVisible: boolean;
}

// Using AdminStats from secure service

interface UserData {
  id: string;
  user_id: string;
  display_name: string;
  wallet_address: string;
  verified_wallet_address: string;
  total_chips: number;
  over_balance: number;
  created_at: string;
  player_balances?: Array<{
    game_chips: number;
    over_balance: number;
    total_earnings: number;
  }>;
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
  const [adminWallet, setAdminWallet] = useState("");
  const queryClient = useQueryClient();

  // Check admin status and get admin wallet
  const { data: adminStatus, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-status'],
    queryFn: () => secureAdminService.checkAdminStatus(),
    enabled: isVisible
  });

  // Update admin wallet when status is loaded
  useEffect(() => {
    if (adminStatus?.wallet) {
      setAdminWallet(adminStatus.wallet);
    }
  }, [adminStatus]);

  // Fetch platform statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => secureAdminService.getPlatformStats(),
    enabled: isVisible && adminStatus?.isAdmin
  });

  // Fetch users with enhanced query to get both profile and balance data
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Try to get users with their player_balances joined
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          player_balances (
            game_chips,
            over_balance,
            total_earnings
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Enhanced users query failed, using fallback:', error);
        // Fallback to basic query
        const { data: basicProfiles, error: basicError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (basicError) throw basicError;
        return basicProfiles || [];
      }
      
      return profiles || [];
    },
    enabled: isVisible && activeTab === 'users' && adminStatus?.isAdmin
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => secureAdminService.getAllTransactions(),
    enabled: isVisible && activeTab === 'transactions' && adminStatus?.isAdmin
  });

  // Withdraw to admin wallet mutation
  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => secureAdminService.withdrawFunds(amount),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Successfully withdrew funds. TX: ${result.txHash}`);
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        setWithdrawAmount("");
      } else {
        toast.error("Withdrawal failed");
      }
    },
    onError: (error) => {
      toast.error(`Withdrawal failed: ${error.message}`);
    }
  });

  // Update user balance mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, chips, over }: { userId: string, chips?: number, over?: number }) => 
      secureAdminService.updateUserBalance(userId, chips, over),
    onSuccess: (success) => {
      if (success) {
        toast.success("User balance updated successfully");
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      } else {
        toast.error("Update failed");
      }
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });

  // Add chips to self mutation
  const addChipsMutation = useMutation({
    mutationFn: (amount: number) => secureAdminService.addChipsToSelf(amount),
    onSuccess: (success) => {
      if (success) {
        console.log('✅ FRONTEND: Chips added successfully via mutation');
        toast.success("Chips added successfully! ✨");
        
        // Refresh all relevant queries
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        
        // Trigger chip balance refresh in the UI
        window.dispatchEvent(new CustomEvent('chipBalanceUpdated'));
        
        // Force reload to reflect changes immediately
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('❌ FRONTEND: Add chips returned false via mutation');
        toast.error("Failed to add chips");
      }
    },
    onError: (error) => {
      console.error('💥 FRONTEND: Add chips mutation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to add chips: ${errorMessage}`);
    }
  });

  if (!isVisible) return null;

  // Show loading while checking admin status
  if (adminLoading) {
    return (
      <Card className="p-6 bg-gradient-card border-primary">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
          <div>
            <h2 className="text-xl font-bold">Verifying Admin Access...</h2>
            <p className="text-sm text-muted-foreground">Checking credentials</p>
          </div>
        </div>
      </Card>
    );
  }

  // Show access denied if not admin
  if (!adminStatus?.isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
            <p className="text-sm text-muted-foreground">Admin privileges required</p>
          </div>
        </div>
      </Card>
    );
  }

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
              <p className="text-xs text-muted-foreground">Admin Wallet: {adminWallet}</p>
            </div>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            ADMIN ACCESS
          </Badge>
        </div>
      </Card>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <AdminOverview 
            isAdmin={adminStatus?.isAdmin || false}
            stats={stats}
            onRefreshStats={() => queryClient.invalidateQueries({ queryKey: ['admin-stats'] })}
          />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <AdminUsers isAdmin={adminStatus?.isAdmin || false} />
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="space-y-4">
          <WalletAdminPanel isAdmin={adminStatus?.isAdmin || false} />
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
                      <p className="text-sm">{tx.amount_chips || 0} Chips</p>
                      <p className="text-sm text-neon-green">{tx.amount_over || 0} OVER</p>
                      <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Blockchain Tab */}
        <TabsContent value="blockchain" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Blockchain Explorer
            </h3>
            <p className="text-muted-foreground mb-6">
              Check real OVER balances and transaction history directly from Over Protocol blockchain
            </p>
            <BlockchainBalanceChecker defaultAddress={adminWallet} />
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
                      Funds will be sent to: {adminWallet}
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
                <code className="text-xs bg-background p-2 rounded block">{adminWallet}</code>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2">Platform Status</h4>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2">Debug Tools</h4>
                <p className="text-sm text-muted-foreground mb-4">Admin debugging utilities</p>
                <div className="space-y-2">
                  <div className="border border-border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-2">Wallet Debug Panel</h5>
                    <div className="text-xs text-muted-foreground">
                      <div>{'{'}</div>
                      <div>&nbsp;&nbsp;"isAdmin": {adminStatus?.isAdmin ? 'true' : 'false'},</div>
                      <div>&nbsp;&nbsp;"walletAddress": "{walletAddress || 'None'}",</div>
                      <div>&nbsp;&nbsp;"adminWallet": "{adminWallet}"</div>
                      <div>{'}'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};