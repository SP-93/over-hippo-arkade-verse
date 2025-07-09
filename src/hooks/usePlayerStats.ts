import { useState, useEffect } from "react";
import { toast } from "sonner";
import { securePlayerService } from "@/services/secure-player";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerStats {
  walletAddress: string;
  totalScore: number;
  gamesPlayed: number;
  highScores: {
    tetris: number;
    snake: number;
    pacman: number;
  };
  achievements: string[];
  overTokens: number;
  lastPlayed: string;
}

export const usePlayerStats = (walletAddress: string) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    walletAddress,
    totalScore: 0,
    gamesPlayed: 0,
    highScores: {
      tetris: 0,
      snake: 0,
      pacman: 0
    },
    achievements: [],
    overTokens: 0,
    lastPlayed: new Date().toISOString()
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load real player stats from database
  useEffect(() => {
    if (!walletAddress) return;
    
    const loadPlayerStats = async () => {
      setIsLoading(true);
      try {
        // Get real balance
        const balance = await securePlayerService.getPlayerBalance();
        
        // Get game scores
        const scores = await securePlayerService.getGameScores();
        
        if (balance) {
          const gameStats = scores.reduce((acc, score) => {
            acc.totalScore += score.score;
            acc.gamesPlayed += 1;
            
            // Track high scores
            if (score.score > acc.highScores[score.game_type as keyof typeof acc.highScores]) {
              acc.highScores[score.game_type as keyof typeof acc.highScores] = score.score;
            }
            
            return acc;
          }, {
            totalScore: 0,
            gamesPlayed: 0,
            highScores: { tetris: 0, snake: 0, pacman: 0 }
          });

          setPlayerStats({
            walletAddress,
            totalScore: gameStats.totalScore,
            gamesPlayed: gameStats.gamesPlayed,
            highScores: gameStats.highScores,
            achievements: [], // TODO: Implement achievements system
            overTokens: balance.overTokens,
            lastPlayed: scores[0]?.created_at || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Failed to load player stats:", error);
        // Fallback to localStorage for offline mode
        const savedStats = localStorage.getItem(`player_stats_${walletAddress}`);
        if (savedStats) {
          try {
            const parsedStats = JSON.parse(savedStats);
            setPlayerStats(parsedStats);
          } catch (e) {
            console.error("Failed to parse saved stats:", e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerStats();
  }, [walletAddress]);

  // Save stats to localStorage as backup
  useEffect(() => {
    if (!walletAddress) return;
    localStorage.setItem(`player_stats_${walletAddress}`, JSON.stringify(playerStats));
  }, [playerStats, walletAddress]);

  const updateScore = async (gameType: 'tetris' | 'snake' | 'pacman', score: number) => {
    try {
      // Submit score to backend first
      const result = await securePlayerService.submitGameScore(gameType, score);
      
      if (result) {
        setPlayerStats(prev => {
          const newStats = { ...prev };
          
          // Update local stats
          newStats.totalScore += score;
          newStats.gamesPlayed += 1;
          newStats.lastPlayed = new Date().toISOString();
          newStats.overTokens += result.overReward;
          
          // Update high score if better
          if (score > newStats.highScores[gameType]) {
            newStats.highScores[gameType] = score;
            toast.success(`New ${gameType} high score: ${score.toLocaleString()}!`);
            
            // Award achievements for high scores
            const achievementKey = `${gameType}_highscore_${Math.floor(score / 10000)}`;
            if (!newStats.achievements.includes(achievementKey)) {
              newStats.achievements.push(achievementKey);
              toast.success(`Achievement unlocked: ${gameType} Master!`);
            }
          }
          
          return newStats;
        });

        if (result.overReward > 0) {
          toast.success(`Earned ${result.overReward} OVER tokens!`);
        }
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      toast.error("Failed to submit score to blockchain");
      
      // Update local stats anyway
      setPlayerStats(prev => ({
        ...prev,
        totalScore: prev.totalScore + score,
        gamesPlayed: prev.gamesPlayed + 1,
        lastPlayed: new Date().toISOString()
      }));
    }
  };

  const addOverTokens = (amount: number) => {
    setPlayerStats(prev => ({
      ...prev,
      overTokens: prev.overTokens + amount
    }));
    toast.success(`Earned ${amount} OVER tokens!`);
  };

  const spendOverTokens = async (amount: number): Promise<boolean> => {
    if (playerStats.overTokens >= amount) {
      try {
        // For chip purchases, this will be handled by the purchase flow
        // For other spending, implement withdrawal logic here
        setPlayerStats(prev => ({
          ...prev,
          overTokens: prev.overTokens - amount
        }));
        return true;
      } catch (error) {
        console.error("Failed to spend OVER tokens:", error);
        toast.error("Transaction failed");
        return false;
      }
    }
    toast.error("Insufficient OVER tokens!");
    return false;
  };

  return {
    playerStats,
    updateScore,
    addOverTokens,
    spendOverTokens,
    setPlayerStats,
    isLoading
  };
};