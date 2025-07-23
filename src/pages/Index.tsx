
import { useState, useEffect } from "react";
import { Coins, Zap, Trophy, Calendar, Timer, ShoppingCart, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { HippoBackground } from "@/components/HippoBackground";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { GameGrid } from "@/components/GameGrid";
import { OverProtocolIntegration } from "@/components/OverProtocolIntegration";
import { SwapButton } from "@/components/SwapButton";
import { WatchVideoButton } from "@/components/WatchVideoButton";
import { ChipPurchaseModal } from "@/components/ChipPurchaseModal";
import { PlayerDashboard } from "@/components/PlayerDashboard";
import { useSecureBalance } from "@/hooks/useSecureBalance";
import { useWoverOperations } from "@/hooks/useWoverOperations";

const Index = () => {
  const navigate = useNavigate();
  const [showChipPurchase, setShowChipPurchase] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState(18 * 3600 + 45 * 60); // 18h 45m in seconds
  const [recentScores] = useState([
    { game: "Snake 3D", score: 1250, time: "2 hours ago" },
    { game: "Tetris 3D", score: 2800, time: "5 hours ago" },
    { game: "Asteroids 3D", score: 950, time: "1 day ago" },
  ]);

  const { purchaseChips } = useWoverOperations();
  const { 
    gameChips, 
    woverBalance, 
    totalEarnings, 
    hasWallet, 
    isLoading, 
    refreshBalance 
  } = useSecureBalance();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(prev => prev <= 0 ? 24 * 3600 : prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoReward = (reward: number) => {
    toast.success(`You earned ${reward} chip from watching the video!`);
    refreshBalance();
  };

  const handleWoverPurchaseChips = async (chipAmount: number) => {
    try {
      const result = await purchaseChips({ chipAmount });
      
      if (result.success) {
        toast.success(`Successfully purchased ${chipAmount} chips for ${result.woverSpent} WOVER!`);
        setShowChipPurchase(false);
      } else {
        toast.error("Purchase failed: " + result.error);
      }
    } catch (error) {
      console.error('Chip purchase error:', error);
      toast.error("Failed to purchase chips");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <HippoBackground />
      <ParticleCanvas width={800} height={600} />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-neon-pink via-arcade-gold to-neon-blue bg-clip-text text-transparent animate-glow">
            ARCADE LEGENDS
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Play legendary arcade games in stunning 3D and earn OVER tokens!
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-gradient-card border-neon-pink">
              <div className="flex items-center gap-3">
                <Coins className="h-6 w-6 text-arcade-gold" />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Chips</p>
                  <p className="text-2xl font-bold text-arcade-gold">{gameChips}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-card border-neon-blue">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-neon-green" />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">WOVER</p>
                  <p className="text-2xl font-bold text-neon-green">{woverBalance.toFixed(3)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-card border-primary">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Earnings</p>
                  <p className="text-2xl font-bold text-primary">{totalEarnings}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-card border-accent">
              <div className="flex items-center gap-3">
                <Timer className="h-6 w-6 text-accent" />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Reset</p>
                  <p className="text-lg font-bold text-accent">{formatTime(timeUntilReset)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              onClick={() => navigate('/games')} 
              size="lg" 
              className="bg-gradient-to-r from-neon-pink to-neon-blue hover:scale-105 transition-transform"
            >
              🎮 Start Playing
            </Button>
            
            <Button 
              onClick={() => setShowChipPurchase(true)}
              variant="outline" 
              size="lg"
              className="border-arcade-gold text-arcade-gold hover:bg-arcade-gold hover:text-background"
              disabled={isLoading || !hasWallet}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy Chips
            </Button>
            
            <SwapButton />
            
            <WatchVideoButton onRewardEarned={handleVideoReward} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Grid - Takes up 2 columns */}
          <div className="lg:col-span-2">
        <GameGrid 
          playerChips={gameChips} 
          onPlayGame={(gameId) => navigate(`/game?type=${gameId}`)} 
        />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Scores */}
            <Card className="p-6 bg-gradient-card border-border">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Recent High Scores
              </h3>
              <div className="space-y-3">
                {recentScores.map((score, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{score.game}</p>
                      <p className="text-xs text-muted-foreground">{score.time}</p>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {score.score.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* OVER Protocol Integration */}
        <OverProtocolIntegration 
          walletAddress={'player-wallet'} 
          overBalance={woverBalance} 
          onPurchaseChips={handleWoverPurchaseChips} 
          onWithdrawTokens={(amount) => toast.info(`Withdraw ${amount} WOVER requested`)} 
        />

            {/* Daily Challenge */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                Daily Challenge
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Score 5,000+ points in Snake 3D to earn bonus OVER tokens!
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  🏆 +10 OVER
                </Badge>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  View Details
                </Button>
              </div>
            </Card>

            {/* VIP Membership */}
            <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                VIP Membership
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock exclusive games, premium tournaments, and special rewards!
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                size="sm"
              >
                Upgrade to VIP
              </Button>
            </Card>
          </div>
        </div>

        {/* Player Dashboard */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Player Dashboard</h2>
          <PlayerDashboard />
        </div>
      </div>

      {/* Chip Purchase Modal */}
      {showChipPurchase && (
        <ChipPurchaseModal 
          isConnected={hasWallet}
          onPurchase={handleWoverPurchaseChips}
        />
      )}
    </div>
  );
};

export default Index;
