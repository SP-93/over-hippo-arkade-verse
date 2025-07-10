import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { secureAdminService } from "@/services/secure-admin";
import { useSecureBalance } from "@/hooks/useSecureBalance";
import { useGlobalBalance } from "@/contexts/GlobalBalanceContext";

interface BalanceDebugInfo {
  databaseBalance: number;
  hookBalance: number;
  walletAddress: string;
  lastUpdated: string;
  syncStatus: 'synced' | 'out_of_sync' | 'unknown';
}

interface AdminBalanceDebuggerProps {
  isAdmin: boolean;
}

export const AdminBalanceDebugger = ({ isAdmin }: AdminBalanceDebuggerProps) => {
  const [debugInfo, setDebugInfo] = useState<BalanceDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [chipAmount, setChipAmount] = useState(10);
  const { balance, refreshBalance } = useSecureBalance();
  const { gameChips: globalGameChips, refreshBalance: globalRefreshBalance } = useGlobalBalance();

  const loadDebugInfo = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Get current user's wallet
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("No authenticated session");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('verified_wallet_address')
        .eq('user_id', session.session.user.id)
        .single();

      if (!profile?.verified_wallet_address) {
        toast.error("No verified wallet found");
        return;
      }

      // Get balance directly from database
      const { data: dbBalance } = await supabase
        .from('player_balances')
        .select('*')
        .eq('wallet_address', profile.verified_wallet_address)
        .single();

      const databaseBalance = dbBalance?.game_chips || 0;
      const hookBalance = balance.game_chips;
      const syncStatus: BalanceDebugInfo['syncStatus'] = 
        databaseBalance === hookBalance ? 'synced' : 'out_of_sync';

      setDebugInfo({
        databaseBalance,
        hookBalance,
        walletAddress: profile.verified_wallet_address,
        lastUpdated: dbBalance?.last_updated || 'Never',
        syncStatus
      });

    } catch (error) {
      console.error('Failed to load debug info:', error);
      toast.error("Failed to load debug information");
    } finally {
      setLoading(false);
    }
  };

  const forceSync = async () => {
    try {
      console.log('🔄 ADMIN DEBUG: Force syncing balances');
      await secureAdminService.forceRefreshBalances();
      await refreshBalance();
      await loadDebugInfo();
      toast.success("Balance sync triggered");
    } catch (error) {
      console.error('Force sync failed:', error);
      toast.error("Failed to sync balances");
    }
  };

  const addChipsToSelf = async () => {
    try {
      setLoading(true);
      
      // Optimistic update for UI responsiveness
      const previousChips = globalGameChips;
      toast.loading(`Adding ${chipAmount} chips...`);
      
      await secureAdminService.addChipsToSelf(chipAmount);
      
      // Force immediate refresh of all balance components
      await Promise.all([
        refreshBalance(),
        globalRefreshBalance(),
        loadDebugInfo()
      ]);
      
      // Trigger multiple refresh events to ensure sync
      window.dispatchEvent(new Event('balanceUpdated'));
      window.dispatchEvent(new Event('forceBalanceRefresh'));
      window.dispatchEvent(new CustomEvent('adminBalanceUpdated', { 
        detail: { chipAmount, previousChips, newChips: globalGameChips + chipAmount }
      }));
      
      toast.success(`✅ Successfully added ${chipAmount} chips! (${previousChips} → ${globalGameChips + chipAmount})`);
      
    } catch (error) {
      console.error('Add chips failed:', error);
      toast.error("Failed to add chips: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const emergencySync = async () => {
    // Safety confirmation dialog
    const confirmed = window.confirm(
      "⚠️ Emergency Sync Warning!\n\n" +
      "This will force refresh all balance data from the database.\n" +
      "For admin wallets, this is safe and will preserve your chips.\n" +
      "Continue with emergency sync?"
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      toast.loading("🚨 Emergency sync in progress...");
      
      // Get admin status for safety check
      const { isAdmin } = await secureAdminService.checkAdminStatus();
      
      if (isAdmin) {
        console.log('✅ ADMIN: Emergency sync for admin wallet - safe mode');
        toast.info("Admin wallet detected - safe sync mode enabled");
      }
      
      // Force refresh everything with admin protection
      await Promise.all([
        secureAdminService.forceRefreshBalances(),
        refreshBalance(),
        globalRefreshBalance(),
        loadDebugInfo()
      ]);
      
      // Clear only UI cached data, not critical balance data
      localStorage.removeItem('ui_chip_cache');
      sessionStorage.removeItem('game_ui_state');
      
      // Trigger all possible refresh events
      window.dispatchEvent(new Event('balanceUpdated'));
      window.dispatchEvent(new Event('chipBalanceUpdated'));
      window.dispatchEvent(new Event('forceBalanceRefresh'));
      
      toast.success("🔄 Emergency sync completed safely!");
      
    } catch (error) {
      console.error('Emergency sync failed:', error);
      toast.error("Emergency sync failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDebugInfo();
    }
  }, [isAdmin, balance.game_chips]);

  // Listen for balance update events
  useEffect(() => {
    const handleBalanceUpdate = () => {
      console.log('🔄 ADMIN DEBUG: Balance update event received');
      setTimeout(() => loadDebugInfo(), 500);
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('adminBalanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('adminBalanceUpdated', handleBalanceUpdate);
    };
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-card border-primary">
      <div className="flex items-center gap-3 mb-4">
        <Database className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-bold text-primary">Balance Debugger</h3>
          <p className="text-sm text-muted-foreground">Debug chip balance synchronization</p>
        </div>
        <Button
          onClick={loadDebugInfo}
          disabled={loading}
          size="sm"
          variant="outline"
          className="ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          {/* Sync Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sync Status:</span>
            <Badge variant={debugInfo.syncStatus === 'synced' ? 'default' : 'destructive'}>
              {debugInfo.syncStatus === 'synced' ? 'Synced' : 'Out of Sync'}
              {debugInfo.syncStatus === 'synced' ? 
                <Zap className="h-3 w-3 ml-1" /> : 
                <AlertTriangle className="h-3 w-3 ml-1" />
              }
            </Badge>
          </div>

          {/* Balance Comparison */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Database Balance</div>
              <div className="text-lg font-bold">{debugInfo.databaseBalance} chips</div>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Hook Balance</div>
              <div className="text-lg font-bold">{debugInfo.hookBalance} chips</div>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Global Balance</div>
              <div className="text-lg font-bold">{globalGameChips} chips</div>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="p-3 bg-background/50 rounded-lg">
            <div className="text-xs text-muted-foreground">Wallet Address</div>
            <div className="text-sm font-mono">{debugInfo.walletAddress}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Last Updated: {new Date(debugInfo.lastUpdated).toLocaleString()}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={chipAmount}
                  onChange={(e) => setChipAmount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                  placeholder="Chip amount"
                />
              </div>
              <Button
                onClick={addChipsToSelf}
                disabled={loading}
                size="sm"
              >
                Add Chips
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={forceSync}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Force Sync
              </Button>
              <Button
                onClick={emergencySync}
                disabled={loading}
                size="sm"
                variant="destructive"
              >
                <ShieldCheck className="h-4 w-4 mr-1" />
                Emergency Sync
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading && !debugInfo && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading debug info...</p>
        </div>
      )}
    </Card>
  );
};