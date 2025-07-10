import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Timer, Zap, ShoppingCart, Crown, Star } from "lucide-react";
import { toast } from "sonner";
import { useSecureBalance } from "@/hooks/useSecureBalance";
import { WatchVideoButton } from "@/components/WatchVideoButton";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { BalanceErrorBoundary } from "@/components/BalanceErrorBoundary";

interface PlayerDashboardProps {
  playerAddress?: string;
  playerChips?: number;
}

export const PlayerDashboard = ({ playerAddress, playerChips }: PlayerDashboardProps) => {
  const [timeUntilReset, setTimeUntilReset] = useState(18 * 3600 + 45 * 60); // 18h 45m in seconds
  const { isVipActive, vipTimeRemaining, purchasePremiumChips, purchaseVipStatus } = usePremiumFeatures();
  
  // Use secure balance hook
  const { 
    balance, 
    isLoading, 
    gameChips, 
    overBalance, 
    totalEarnings,
    hasWallet,
    refreshBalance,
    spendOver,
    addChips
  } = useSecureBalance();

  const chips = hasWallet ? gameChips : (playerChips || 3);
  const displayOverBalance = hasWallet ? overBalance : 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(prev => {
        if (prev <= 0) {
          // Timer reset - refresh balance
          refreshBalance();
          return 24 * 3600; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshBalance]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Purchase chips using secure balance service
  const purchaseChips = async (packageType: 'small' | 'medium' | 'large' | 'premium') => {
    const packages = {
      small: { chips: 3, cost: 3, type: 'standard' as const },
      medium: { chips: 7, cost: 7, type: 'standard' as const },
      large: { chips: 15, cost: 12, type: 'standard' as const },
      premium: { chips: 5, cost: 8, type: 'premium' as const } // Premium chips give 3 lives each
    };

    const selected = packages[packageType];
    
    // Check sufficient OVER balance
    if (displayOverBalance < selected.cost) {
      toast.error(`Insufficient OVER balance. Need ${selected.cost} OVER.`);
      return;
    }
    
    const livesInfo = selected.type === 'premium' ? ' (3 lives each!)' : ' (2 lives each)';
    toast.info(`Purchasing ${selected.chips} ${selected.type} chips for ${selected.cost} OVER...${livesInfo}`);
    
    try {
      if (selected.type === 'premium') {
        // Use premium features for premium chips
        await purchasePremiumChips.mutateAsync({ 
          chipAmount: selected.chips, 
          overCost: selected.cost, 
          premiumType: 'premium' 
        });
      } else {
        // Use secure balance service for standard chips
        const spendResult = await spendOver(selected.cost, `chip_purchase_${packageType}`);
        if (!spendResult.success) {
          toast.error("Failed to spend OVER: " + spendResult.error);
          return;
        }
        
        const addResult = await addChips(selected.chips, `purchase_${packageType}_${Date.now()}`);
        if (!addResult.success) {
          toast.error("Failed to add chips: " + addResult.error);
          return;
        }
        
        toast.success(`Successfully purchased ${selected.chips} chips! New balance: ${addResult.new_chips}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error("Purchase failed");
    }
  };


  const handleVipPurchase = () => {
    if (displayOverBalance < 10) {
      toast.error("Insufficient OVER balance. Need 10 OVER for VIP status.");
      return;
    }
    purchaseVipStatus.mutate(30);
  };

  const handleVideoReward = (reward: number) => {
    // This would call the backend to add chips
    toast.success(`You earned ${reward} chip from watching the video!`);
    refreshBalance(); // Refresh balance instead of query invalidation
  };

  return (
    <div className="space-y-6">
      {/* Player Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceErrorBoundary>
          <Card className="p-6 bg-gradient-card border-neon-pink animate-glow">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-arcade-gold animate-float" />
              <div>
                <p className="text-sm text-muted-foreground">Chips Remaining</p>
                <p className="text-3xl font-black text-arcade-gold">{chips}</p>
              </div>
            </div>
          </Card>
        </BalanceErrorBoundary>

        <BalanceErrorBoundary>
          <Card className="p-6 bg-gradient-card border-neon-blue">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-neon-green animate-neon-pulse" />
              <div>
                <p className="text-sm text-muted-foreground">OVER Balance</p>
                <p className="text-3xl font-black text-neon-green">{displayOverBalance.toFixed(3)}</p>
              </div>
            </div>
          </Card>
        </BalanceErrorBoundary>

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
          {formatTime(timeUntilReset)} until your 3 daily chips are restored
        </p>
      </Card>

      {/* VIP Status Display */}
      {isVipActive && (
        <Card className="p-4 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-yellow-500">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="font-bold text-yellow-500">VIP Status Active</h3>
            <Badge variant="secondary">{vipTimeRemaining}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Enjoy premium features, priority support, and exclusive benefits!
          </p>
        </Card>
      )}

      {/* Watch Video for Free Chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WatchVideoButton onRewardEarned={handleVideoReward} />
        
        {/* VIP Status Purchase */}
        {!isVipActive && (
          <Card className="p-6 bg-gradient-to-r from-yellow-400/5 to-yellow-600/5 border-yellow-500/30">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              VIP Membership
            </h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Priority game access</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Exclusive tournaments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Premium chat features</span>
              </div>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-2xl font-black text-yellow-500">10 OVER</p>
              <p className="text-sm text-muted-foreground">30 days membership</p>
            </div>
            
            <Button 
              onClick={handleVipPurchase}
              disabled={purchaseVipStatus.isPending || displayOverBalance < 10}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
            >
              {purchaseVipStatus.isPending ? 'Processing...' : 'Become VIP'}
            </Button>
          </Card>
        )}
      </div>

      {/* Purchase Chips */}
      <Card className="p-6 bg-gradient-card border-accent">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          Purchase Extra Chips
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border border-border rounded-lg text-center">
            <h4 className="font-bold text-lg">Basic Pack</h4>
            <p className="text-2xl font-black text-arcade-gold my-2">3 Chips</p>
            <p className="text-sm text-muted-foreground mb-2">3 OVER</p>
            <p className="text-xs text-muted-foreground mb-4">2 lives each</p>
            <Button 
              variant="arcade"
              onClick={() => purchaseChips('small')}
              disabled={isLoading || displayOverBalance < 3}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Purchase'}
            </Button>
          </div>

          <div className="p-4 border border-neon-blue rounded-lg text-center">
            <h4 className="font-bold text-lg">Value Pack</h4>
            <p className="text-2xl font-black text-neon-blue my-2">7 Chips</p>
            <p className="text-sm text-muted-foreground mb-2">7 OVER</p>
            <p className="text-xs text-muted-foreground mb-4">2 lives each</p>
            <Button 
              variant="secondary"
              onClick={() => purchaseChips('medium')}
              disabled={isLoading || displayOverBalance < 7}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Purchase'}
            </Button>
          </div>

          <div className="p-4 border border-neon-pink rounded-lg text-center relative overflow-hidden">
            <Badge className="absolute -top-2 -right-2 bg-neon-pink text-background animate-neon-pulse">
              BEST VALUE
            </Badge>
            <h4 className="font-bold text-lg">Mega Pack</h4>
            <p className="text-2xl font-black text-neon-pink my-2">15 Chips</p>
            <p className="text-sm text-muted-foreground mb-2">12 OVER</p>
            <p className="text-xs text-muted-foreground mb-4">2 lives each</p>
            <Button 
              variant="neon"
              onClick={() => purchaseChips('large')}
              disabled={isLoading || displayOverBalance < 12}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Purchase'}
            </Button>
          </div>

          <div className="p-4 border border-yellow-500 rounded-lg text-center relative overflow-hidden">
            <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-background animate-neon-pulse">
              PREMIUM
            </Badge>
            <h4 className="font-bold text-lg">Premium Pack</h4>
            <p className="text-2xl font-black text-yellow-500 my-2">5 Chips</p>
            <p className="text-sm text-muted-foreground mb-2">8 OVER</p>
            <p className="text-xs text-yellow-500 font-bold mb-4">3 lives each!</p>
            <Button 
              onClick={() => purchaseChips('premium')}
              disabled={purchasePremiumChips.isPending || displayOverBalance < 8}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
            >
              {purchasePremiumChips.isPending ? 'Processing...' : 'Purchase'}
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