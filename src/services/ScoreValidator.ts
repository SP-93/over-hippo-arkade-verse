import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScoreValidationResult {
  isValid: boolean;
  riskScore: number;
  reason?: string;
  maxAllowed?: number;
}

interface ScorePattern {
  timestamp: number;
  score: number;
  gameType: string;
  sessionId?: string;
}

export class ScoreValidator {
  private scoreHistory: Map<string, ScorePattern[]> = new Map();
  private readonly MAX_SCORE_PER_MINUTE = {
    'snake-3d': 5000,
    'tetris-3d': 8000,
    'asteroids-3d': 6000,
    'breakout-3d': 4000,
    'frogger-3d': 3000,
    'kingkong-3d': 7000,
    'mario-3d': 5500,
    'pacman-3d': 4500,
    'flipper-3d': 6500
  };
  
  private readonly SUSPICIOUS_PATTERNS = {
    perfectIncrement: 100, // Perfect score increments
    tooFastProgress: 10000, // Score increase per second
    impossibleScore: 50000, // Maximum realistic score
    rapidRepeats: 5 // Same score multiple times
  };

  async validateScore(
    score: number, 
    gameType: string, 
    sessionId?: string,
    timePlayed?: number
  ): Promise<ScoreValidationResult> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      return { isValid: false, riskScore: 100, reason: 'No user authentication' };
    }

    const userKey = `${userId}_${gameType}`;
    const now = Date.now();
    
    // Initialize or get user's score history
    if (!this.scoreHistory.has(userKey)) {
      this.scoreHistory.set(userKey, []);
    }
    
    const history = this.scoreHistory.get(userKey)!;
    
    // Clean old entries (older than 5 minutes)
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentHistory = history.filter(h => h.timestamp > fiveMinutesAgo);
    
    // Add current score to history
    recentHistory.push({
      timestamp: now,
      score,
      gameType,
      sessionId
    });
    
    this.scoreHistory.set(userKey, recentHistory);

    // Perform validations
    const validations = [
      this.validateScoreRate(score, gameType, recentHistory),
      this.validateScoreProgression(score, recentHistory),
      this.validateGameTime(score, gameType, timePlayed),
      this.validateScorePatterns(score, recentHistory),
      await this.validateAgainstDatabase(score, gameType, userId)
    ];

    // Calculate overall risk score
    const maxRiskScore = Math.max(...validations.map(v => v.riskScore));
    const isValid = maxRiskScore < 80; // Risk scores above 80 are considered invalid

    // Find the most concerning validation
    const highestRisk = validations.find(v => v.riskScore === maxRiskScore);

    if (!isValid) {
      console.warn(`🚫 Score validation failed: ${highestRisk?.reason}`, {
        score,
        gameType,
        riskScore: maxRiskScore,
        sessionId
      });

      // Log suspicious activity
      await this.logSuspiciousActivity(userId, gameType, score, maxRiskScore, highestRisk?.reason);
    }

    return {
      isValid,
      riskScore: maxRiskScore,
      reason: highestRisk?.reason,
      maxAllowed: highestRisk?.maxAllowed
    };
  }

  private validateScoreRate(score: number, gameType: string, history: ScorePattern[]): ScoreValidationResult {
    const maxPerMinute = this.MAX_SCORE_PER_MINUTE[gameType] || 5000;
    const oneMinuteAgo = Date.now() - 60 * 1000;
    
    const scoresInLastMinute = history
      .filter(h => h.timestamp > oneMinuteAgo)
      .reduce((sum, h) => sum + h.score, 0);

    if (scoresInLastMinute > maxPerMinute) {
      return {
        isValid: false,
        riskScore: 90,
        reason: `Score rate too high: ${scoresInLastMinute}/min exceeds ${maxPerMinute}/min`,
        maxAllowed: maxPerMinute
      };
    }

    const riskScore = Math.min(80, (scoresInLastMinute / maxPerMinute) * 60);
    return { isValid: true, riskScore };
  }

  private validateScoreProgression(score: number, history: ScorePattern[]): ScoreValidationResult {
    if (history.length < 2) return { isValid: true, riskScore: 0 };

    const lastScore = history[history.length - 2].score;
    const scoreDiff = score - lastScore;
    const timeDiff = (Date.now() - history[history.length - 2].timestamp) / 1000; // seconds

    // Check for impossible score increases
    if (scoreDiff > this.SUSPICIOUS_PATTERNS.tooFastProgress * timeDiff) {
      return {
        isValid: false,
        riskScore: 95,
        reason: `Score increased too rapidly: +${scoreDiff} in ${timeDiff}s`
      };
    }

    // Check for perfect increments (often indicates automation)
    const perfectIncrements = history
      .slice(-5) // Last 5 scores
      .map((h, i, arr) => i > 0 ? h.score - arr[i-1].score : 0)
      .filter(diff => diff > 0 && diff % this.SUSPICIOUS_PATTERNS.perfectIncrement === 0);

    if (perfectIncrements.length >= 3) {
      return {
        isValid: false,
        riskScore: 85,
        reason: `Suspicious perfect score increments detected`
      };
    }

    return { isValid: true, riskScore: 0 };
  }

  private validateGameTime(score: number, gameType: string, timePlayed?: number): ScoreValidationResult {
    if (!timePlayed) return { isValid: true, riskScore: 10 }; // Slight risk if no time provided

    const scorePerSecond = score / timePlayed;
    const maxReasonableRate = 100; // 100 points per second is very high

    if (scorePerSecond > maxReasonableRate) {
      return {
        isValid: false,
        riskScore: 90,
        reason: `Score rate too high: ${scorePerSecond.toFixed(1)} points/second`
      };
    }

    // Minimum time checks - you can't get high scores in 1 second
    if (score > 1000 && timePlayed < 10) {
      return {
        isValid: false,
        riskScore: 95,
        reason: `High score (${score}) achieved too quickly (${timePlayed}s)`
      };
    }

    return { isValid: true, riskScore: Math.min(40, scorePerSecond / maxReasonableRate * 40) };
  }

  private validateScorePatterns(score: number, history: ScorePattern[]): ScoreValidationResult {
    // Check for repeated identical scores
    const recentSameScores = history
      .slice(-10)
      .filter(h => h.score === score)
      .length;

    if (recentSameScores >= this.SUSPICIOUS_PATTERNS.rapidRepeats) {
      return {
        isValid: false,
        riskScore: 88,
        reason: `Same score (${score}) submitted ${recentSameScores} times recently`
      };
    }

    // Check for impossible scores
    if (score > this.SUSPICIOUS_PATTERNS.impossibleScore) {
      return {
        isValid: false,
        riskScore: 100,
        reason: `Score (${score}) exceeds maximum realistic score (${this.SUSPICIOUS_PATTERNS.impossibleScore})`
      };
    }

    return { isValid: true, riskScore: 0 };
  }

  private async validateAgainstDatabase(score: number, gameType: string, userId: string): Promise<ScoreValidationResult> {
    try {
      // Check user's historical scores
      const { data: userScores } = await supabase
        .from('game_scores')
        .select('score, created_at')
        .eq('user_id', userId)
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(10);

      if (userScores && userScores.length > 0) {
        const maxUserScore = userScores[0].score;
        
        // If this score is more than 5x their previous best, it's suspicious
        if (score > maxUserScore * 5 && maxUserScore > 100) {
          return {
            isValid: false,
            riskScore: 92,
            reason: `Score (${score}) is ${Math.round(score/maxUserScore)}x higher than previous best (${maxUserScore})`
          };
        }
      }

      // Check global leaderboard
      const { data: topScores } = await supabase
        .from('game_scores')
        .select('score')
        .eq('game_type', gameType)
        .order('score', { ascending: false })
        .limit(10);

      if (topScores && topScores.length > 0) {
        const globalBest = topScores[0].score;
        
        // If score is higher than current global best by more than 50%, it's very suspicious
        if (score > globalBest * 1.5) {
          return {
            isValid: false,
            riskScore: 98,
            reason: `Score (${score}) exceeds global best (${globalBest}) by more than 50%`
          };
        }
      }

      return { isValid: true, riskScore: 0 };
    } catch (error) {
      console.error('Database validation error:', error);
      return { isValid: true, riskScore: 20 }; // Slight risk on database error
    }
  }

  private async logSuspiciousActivity(
    userId: string, 
    gameType: string, 
    score: number, 
    riskScore: number, 
    reason?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_user_behavior', {
        p_action_type: 'suspicious_score',
        p_action_details: {
          gameType,
          score,
          riskScore,
          reason,
          timestamp: new Date().toISOString()
        },
        p_session_id: 'score_validation',
        p_ip_address: null,
        p_user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Clear history for a user (useful for testing)
  clearHistory(userId: string, gameType?: string): void {
    if (gameType) {
      this.scoreHistory.delete(`${userId}_${gameType}`);
    } else {
      // Clear all history for user
      const keysToDelete = Array.from(this.scoreHistory.keys())
        .filter(key => key.startsWith(`${userId}_`));
      keysToDelete.forEach(key => this.scoreHistory.delete(key));
    }
  }
}

export const scoreValidator = new ScoreValidator();