import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlockchainBalance } from "@/hooks/useBlockchainBalance";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from "lucide-react";

interface BlockchainBalanceDisplayProps {
  walletAddress: string | null;
  onRefresh?: () => void;
}

export const BlockchainBalanceDisplay = ({ walletAddress, onRefresh }: BlockchainBalanceDisplayProps) => {
  const { balance, isLoading, error, refreshBalance, lastUpdated, networkHealth } = useBlockchainBalance(walletAddress);

  const getNetworkStatusIcon = () => {
    switch (networkHealth) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-neon-green" />;
      case 'slow':
        return <Clock className="h-4 w-4 text-arcade-gold" />;
      case 'down':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNetworkStatusText = () => {
    switch (networkHealth) {
      case 'healthy':
        return 'Network Healthy';
      case 'slow':
        return 'Network Slow';
      case 'down':
        return 'Network Down';
      default:
        return 'Checking...';
    }
  };

  const getNetworkStatusColor = () => {
    switch (networkHealth) {
      case 'healthy':
        return 'border-neon-green text-neon-green';
      case 'slow':
        return 'border-arcade-gold text-arcade-gold';
      case 'down':
        return 'border-red-500 text-red-500';
      default:
        return 'border-muted-foreground text-muted-foreground';
    }
  };

  if (!walletAddress) {
    return (
      <Card className="p-4 bg-gradient-card border-muted">
        <div className="text-center text-muted-foreground">
          <Wifi className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p>Connect wallet to view OVER balance</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-card border-neon-blue">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neon-blue">OVER Balance</h3>
          <Button
            onClick={() => {
              refreshBalance();
              onRefresh?.();
            }}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Network Status */}
        <div className="flex items-center gap-2">
          {getNetworkStatusIcon()}
          <Badge variant="outline" className={getNetworkStatusColor()}>
            {getNetworkStatusText()}
          </Badge>
        </div>

        {/* Balance Display */}
        {error ? (
          <div className="text-center py-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
            <Button 
              onClick={refreshBalance}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : balance ? (
          <div className="text-center py-2">
            <div className="text-2xl font-bold text-neon-green">
              {parseFloat(balance.overBalance).toFixed(4)} OVER
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ≈ ${(parseFloat(balance.overBalance) * 0.1).toFixed(2)} USD
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-3">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-20 mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 text-muted-foreground">
            <p className="text-sm">No balance data available</p>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
          </div>
        )}

        {/* Wallet Address */}
        <div className="text-xs text-muted-foreground text-center">
          <span className="font-mono">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </div>
      </div>
    </Card>
  );
};