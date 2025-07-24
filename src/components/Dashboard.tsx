import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGlobalBalance } from '@/contexts/GlobalBalanceContext';
import { Coins, Timer, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const Dashboard: React.FC = () => {
  const { gameChips, overBalance, woverBalance, refreshBalance } = useGlobalBalance();
  const [isLoading, setIsLoading] = useState(false);

  const maxChips = 100;
  const chipProgress = (gameChips / maxChips) * 100;

  const handlePurchasePack = async (packType: 'small' | 'medium' | 'large') => {
    setIsLoading(true);
    try {
      // Simulate purchase - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const packInfo = {
        small: { chips: 10, cost: 5 },
        medium: { chips: 25, cost: 12 },
        large: { chips: 50, cost: 20 }
      };
      
      toast({
        title: "Purchase Successful!",
        description: `You received ${packInfo[packType].chips} chips for ${packInfo[packType].cost} OVER coins.`,
      });
      
      await refreshBalance();
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate time until next daily reset (for demo purposes)
  const nextReset = new Date();
  nextReset.setHours(24, 0, 0, 0);
  const timeUntilReset = nextReset.getTime() - Date.now();
  const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
  const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Player Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your chips, view stats, and purchase upgrade packs
        </p>
      </div>

      {/* Chip Progress Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Chip Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">{gameChips}</span>
            <span className="text-muted-foreground">/ {maxChips} chips</span>
          </div>
          <Progress value={chipProgress} className="h-2" />
          <div className="text-sm text-muted-foreground">
            {maxChips - gameChips} chips until maximum capacity
          </div>
        </CardContent>
      </Card>

      {/* Daily Reset Timer */}
      <Card className="bg-card/50 backdrop-blur-sm border-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-secondary" />
            Daily Reset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {hoursUntilReset}h {minutesUntilReset}m
            </div>
            <p className="text-muted-foreground">until next chip reset</p>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Packs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { type: 'small' as const, chips: 10, cost: 5, title: 'Small Pack' },
          { type: 'medium' as const, chips: 25, cost: 12, title: 'Medium Pack' },
          { type: 'large' as const, chips: 50, cost: 20, title: 'Large Pack' }
        ].map((pack) => (
          <Card key={pack.type} className="bg-card/50 backdrop-blur-sm border-accent/20">
            <CardHeader className="text-center">
              <CardTitle className="text-accent">{pack.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">+{pack.chips}</div>
                <div className="text-muted-foreground">chips</div>
              </div>
              <div className="space-y-2">
                <div className="text-xl font-semibold text-secondary">{pack.cost} OVER</div>
                <div className="text-sm text-muted-foreground">coins</div>
              </div>
              <Button 
                onClick={() => handlePurchasePack(pack.type)}
                disabled={isLoading || overBalance < pack.cost}
                className="w-full"
                variant={pack.type === 'large' ? 'default' : 'outline'}
              >
                {isLoading ? 'Processing...' : 'Purchase'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              OVER Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{overBalance}</div>
            <p className="text-muted-foreground">OVER coins</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              WOVER Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{woverBalance}</div>
            <p className="text-muted-foreground">WOVER tokens</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};