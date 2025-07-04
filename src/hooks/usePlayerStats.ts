import { useState, useEffect } from "react";
import { toast } from "sonner";

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

  // Load player stats from localStorage
  useEffect(() => {
    if (!walletAddress) return;
    
    const savedStats = localStorage.getItem(`player_stats_${walletAddress}`);
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setPlayerStats(parsedStats);
      } catch (error) {
        console.error("Failed to load player stats:", error);
      }
    }
  }, [walletAddress]);

  // Save stats to localStorage when they change
  useEffect(() => {
    if (!walletAddress) return;
    
    localStorage.setItem(`player_stats_${walletAddress}`, JSON.stringify(playerStats));
  }, [playerStats, walletAddress]);

  const updateScore = (gameType: 'tetris' | 'snake' | 'pacman', score: number) => {
    setPlayerStats(prev => {
      const newStats = { ...prev };
      
      // Update total score
      newStats.totalScore += score;
      newStats.gamesPlayed += 1;
      newStats.lastPlayed = new Date().toISOString();
      
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
  };

  const addOverTokens = (amount: number) => {
    setPlayerStats(prev => ({
      ...prev,
      overTokens: prev.overTokens + amount
    }));
    toast.success(`Earned ${amount} Over tokens!`);
  };

  const spendOverTokens = (amount: number): boolean => {
    if (playerStats.overTokens >= amount) {
      setPlayerStats(prev => ({
        ...prev,
        overTokens: prev.overTokens - amount
      }));
      return true;
    }
    toast.error("Insufficient Over tokens!");
    return false;
  };

  return {
    playerStats,
    updateScore,
    addOverTokens,
    spendOverTokens,
    setPlayerStats
  };
};