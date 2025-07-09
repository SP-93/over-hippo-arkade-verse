import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WalletVerification {
  id: string;
  wallet_address: string;
  user_id: string | null;
  is_banned: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  verified_at: string;
  is_active: boolean;
}

interface WalletAdminPanelProps {
  isAdmin: boolean;
}

export const WalletAdminPanel = ({ isAdmin }: WalletAdminPanelProps) => {
  const [wallets, setWallets] = useState<WalletVerification[]>([]);
  const [searchAddress, setSearchAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Load wallet verifications (admin only)
  const loadWallets = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_verifications')
        .select('*')
        .order('verified_at', { ascending: false });

      if (error) {
        console.error('Failed to load wallets:', error);
        toast.error("Failed to load wallet data");
        return;
      }

      setWallets(data || []);
    } catch (error) {
      console.error('Error loading wallets:', error);
      toast.error("Error loading wallet data");
    } finally {
      setLoading(false);
    }
  };

  // Unban wallet (admin only)
  const unbanWallet = async (walletAddress: string) => {
    if (!isAdmin) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Must be logged in");
        return;
      }

      const { data, error } = await supabase.rpc('unban_wallet', {
        p_wallet_address: walletAddress.toLowerCase(),
        p_admin_user_id: user.id
      });

      if (error) {
        console.error('Failed to unban wallet:', error);
        toast.error("Failed to unban wallet: " + error.message);
        return;
      }

      toast.success(`Wallet ${walletAddress} has been unbanned`);
      loadWallets(); // Refresh the list
    } catch (error) {
      console.error('Error unbanning wallet:', error);
      toast.error("Error unbanning wallet");
    }
  };

  // Search wallet by address
  const searchWallet = async () => {
    if (!searchAddress.trim()) {
      loadWallets();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_verifications')
        .select('*')
        .ilike('wallet_address', `%${searchAddress.toLowerCase()}%`);

      if (error) {
        console.error('Failed to search wallets:', error);
        toast.error("Failed to search wallets");
        return;
      }

      setWallets(data || []);
    } catch (error) {
      console.error('Error searching wallets:', error);
      toast.error("Error searching wallets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadWallets();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center gap-3">
          <Ban className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">You need admin privileges to access this panel.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card border-primary">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-primary">Wallet Admin Panel</h3>
            <p className="text-muted-foreground">Manage wallet verifications and bans</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search wallet address..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="flex-1"
          />
          <Button onClick={searchWallet} disabled={loading}>
            Search
          </Button>
          <Button variant="outline" onClick={loadWallets} disabled={loading}>
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading wallets...</p>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No wallet verifications found</p>
            </div>
          ) : (
            wallets.map((wallet) => (
              <Card key={wallet.id} className={`p-4 ${wallet.is_banned ? 'bg-destructive/5 border-destructive' : 'bg-card border-border'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm">{wallet.wallet_address}</span>
                      <Badge variant={wallet.is_banned ? 'destructive' : 'default'}>
                        {wallet.is_banned ? 'BANNED' : 'ACTIVE'}
                      </Badge>
                      {wallet.is_active && (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>User ID: {wallet.user_id || 'Not assigned'}</div>
                      <div>Verified: {new Date(wallet.verified_at).toLocaleString()}</div>
                      {wallet.is_banned && (
                        <>
                          <div className="text-destructive">
                            Banned: {wallet.banned_at ? new Date(wallet.banned_at).toLocaleString() : 'N/A'}
                          </div>
                          <div className="text-destructive">
                            Reason: {wallet.ban_reason || 'No reason provided'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {wallet.is_banned && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unbanWallet(wallet.wallet_address)}
                      className="ml-4"
                    >
                      Unban
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};