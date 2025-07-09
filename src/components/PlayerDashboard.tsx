import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Timer, Zap, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { securePlayerService } from "@/services/secure-player";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PlayerDashboardProps {
  playerAddress?: string;
  playerChips?: number;
}

export const PlayerDashboard = ({ playerAddress, playerChips }: PlayerDashboardProps) => {
  const [timeUntilReset, setTimeUntilReset] = useState(18 * 3600 + 45 * 60); // 18h 45m in seconds
  const queryClient = useQueryClient();

  // Fetch real player balance
  const { data: balance, isLoading } = useQuery({
    queryKey: ['player-balance'],
    queryFn: () => securePlayerService.getPlayerBalance(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const chips = balance?.gameChips || playerChips || 5;
  const overBalance = balance?.overTokens || 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(prev => {
        if (prev <= 0) {
          // Chips will be reset via backend query refresh
          toast.success("Your chips have been refilled!");
          queryClient.invalidateQueries({ queryKey: ['player-balance'] });
          return 24 * 3600; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [queryClient]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Purchase chips mutation
  const purchaseMutation = useMutation({
    mutationFn: ({ chipAmount, overCost }: { chipAmount: number; overCost: number }) =>
      securePlayerService.purchaseChips(chipAmount, overCost),
    onSuccess: (result) => {
      if (result) {
        toast.success(`Successfully purchased ${result.chipAmount} chips! TX: ${result.txHash}`);
        queryClient.invalidateQueries({ queryKey: ['player-balance'] });
      } else {
        toast.error("Purchase failed");
      }
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    }
  });

  const purchaseChips = (packageType: 'small' | 'medium' | 'large') => {
    const packages = {
      small: { chips: 5, cost: 5 },
      medium: { chips: 10, cost: 10 },
      large: { chips: 20, cost: 17 }
    };

    const selected = packages[packageType];
    
    // Check sufficient OVER balance
    if (overBalance < selected.cost) {
      toast.error(`Insufficient OVER balance. Need ${selected.cost} OVER.`);
      return;
    }
    
    toast.info(`Purchasing ${selected.chips} chips for ${selected.cost} OVER...`);
    purchaseMutation.mutate({ chipAmount: selected.chips, overCost: selected.cost });
  };

  return (
    <div className="space-y-6">
      {/* Player Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-card border-neon-pink animate-glow">
          <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-arcade-gold animate-float" />
            <div>
              <p className="text-sm text-muted-foreground">Chips Remaining</p>
              <p className="text-3xl font-black text-arcade-gold">{chips}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card border-neon-blue">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-neon-green animate-neon-pulse" />
            <div>
              <p className="text-sm text-muted-foreground">OVER Balance</p>
              <p className="text-3xl font-black text-neon-green">{overBalance.toFixed(3)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card border-primary">
          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 text-primary animate-float" />
            <div>
              <p className="text-sm text-muted-foreground">Next Chip Reset</p>
              <p className="text-lg font-bold text-primary">{formatTime(timeUntilReset)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chip Reset Progress */}
      <Card className="p-6 bg-gradient-card border-border">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          Daily Chip Reset Progress
        </h3>
        <Progress 
          value={((24 * 3600 - timeUntilReset) / (24 * 3600)) * 100} 
          className="h-3 mb-2"
        />
        <p className="text-sm text-muted-foreground text-center">
          {formatTime(timeUntilReset)} until your 5 daily chips are restored
        </p>
      </Card>

      {/* Purchase Chips */}
      <Card className="p-6 bg-gradient-card border-accent">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          Purchase Extra Chips
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg text-center">
            <h4 className="font-bold text-lg">Small Pack</h4>
            <p className="text-2xl font-black text-arcade-gold my-2">5 Chips</p>
            <p className="text-sm text-muted-foreground mb-4">5 Over Coins</p>
            <Button 
              variant="arcade"
              onClick={() => purchaseChips('small')}
              disabled={purchaseMutation.isPending || overBalance < 5}
              className="w-full"
            >
              {purchaseMutation.isPending ? 'Processing...' : 'Purchase'}
            </Button>
          </div>

          <div className="p-4 border border-neon-blue rounded-lg text-center">
            <h4 className="font-bold text-lg">Medium Pack</h4>
            <p className="text-2xl font-black text-neon-blue my-2">10 Chips</p>
            <p className="text-sm text-muted-foreground mb-4">10 Over Coins</p>
            <Button 
              variant="secondary"
              onClick={() => purchaseChips('medium')}
              disabled={purchaseMutation.isPending || overBalance < 10}
              className="w-full"
            >
              {purchaseMutation.isPending ? 'Processing...' : 'Purchase'}
            </Button>
          </div>

          <div className="p-4 border border-neon-pink rounded-lg text-center relative overflow-hidden">
            <Badge className="absolute -top-2 -right-2 bg-neon-pink text-background animate-neon-pulse">
              BEST VALUE
            </Badge>
            <h4 className="font-bold text-lg">Large Pack</h4>
            <p className="text-2xl font-black text-neon-pink my-2">20 Chips</p>
            <p className="text-sm text-muted-foreground mb-4">17 Over Coins</p>
            <Button 
              variant="neon"
              onClick={() => purchaseChips('large')}
              disabled={purchaseMutation.isPending || overBalance < 17}
              className="w-full"
            >
              {purchaseMutation.isPending ? 'Processing...' : 'Purchase'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Player Address */}
      {playerAddress && (
        <Card className="p-4 bg-muted border-border">
          <p className="text-sm text-muted-foreground">Connected Wallet:</p>
          <p className="font-mono text-sm text-foreground break-all">{playerAddress}</p>
        </Card>
      )}
    </div>
  );
};