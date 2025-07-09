import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Coins, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { overProtocolBlockchainService, BlockchainBalance, BlockchainTransaction } from "@/services/over-protocol-blockchain";

interface BlockchainBalanceCheckerProps {
  defaultAddress?: string;
}

export const BlockchainBalanceChecker = ({ defaultAddress }: BlockchainBalanceCheckerProps) => {
  const [walletAddress, setWalletAddress] = useState(defaultAddress || "");
  const [balance, setBalance] = useState<BlockchainBalance | null>(null);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async () => {
    if (!walletAddress.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      toast.loading("Checking blockchain balance...");
      
      // Get balance and transactions in parallel
      const [balanceResult, txHistory] = await Promise.all([
        overProtocolBlockchainService.getOverBalance(walletAddress),
        overProtocolBlockchainService.getTransactionHistory(walletAddress, 5)
      ]);

      if (balanceResult) {
        setBalance(balanceResult);
        setTransactions(txHistory);
        toast.success(`Balance loaded: ${balanceResult.overBalance} OVER`);
      } else {
        setError("Failed to fetch balance from blockchain");
        toast.error("Failed to fetch balance");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error occurred";
      setError(errorMsg);
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (hash: string): string => {
    return `https://scan.over.network/tx/${hash}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card border-neon-blue">
        <h3 className="text-xl font-bold text-neon-blue mb-4 flex items-center gap-2">
          <Coins className="h-6 w-6" />
          Over Protocol Blockchain Balance Checker
        </h3>
        
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Enter wallet address (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="font-mono text-sm"
            disabled={isLoading}
          />
          <Button 
            onClick={checkBalance}
            disabled={isLoading || !walletAddress.trim()}
            variant="neon"
            className="px-6"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Check
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}
      </Card>

      {balance && (
        <Card className="p-6 bg-gradient-card border-arcade-gold animate-glow">
          <h4 className="text-lg font-bold text-arcade-gold mb-4">Balance Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Address</p>
              <p className="font-mono text-sm break-all">{balance.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatTimestamp(balance.lastUpdated)}</p>
            </div>
          </div>

          <div className="text-center py-6">
            <p className="text-3xl font-black text-arcade-gold mb-2">
              {parseFloat(balance.overBalance).toFixed(6)} OVER
            </p>
            <p className="text-sm text-muted-foreground">
              {balance.overBalanceWei} wei
            </p>
          </div>

          <Badge className="w-full justify-center bg-neon-green/20 text-neon-green border-neon-green">
            ✓ Balance confirmed on Over Protocol blockchain
          </Badge>
        </Card>
      )}

      {transactions.length > 0 && (
        <Card className="p-6 bg-gradient-card border-neon-purple">
          <h4 className="text-lg font-bold text-neon-purple mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Transactions
          </h4>
          
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div key={tx.hash} className="p-3 bg-muted/20 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant={tx.status === 'success' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {tx.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Block #{tx.blockNumber}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="font-mono">{shortenAddress(tx.from)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="font-mono">{shortenAddress(tx.to)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-semibold text-arcade-gold">{parseFloat(tx.value).toFixed(6)} OVER</p>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(tx.timestamp)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => window.open(getExplorerUrl(tx.hash), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Explorer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};