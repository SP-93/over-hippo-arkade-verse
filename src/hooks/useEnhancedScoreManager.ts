
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { scoreValidator } from "@/services/ScoreValidator";

interface ScoreData {
  score: number;
  comboMultiplier: number;
  bonusPoints: number;
  timePlayed?: number;
}

interface ValidationResult {
  isValid: boolean;
  riskScore: number;
  reason?: string;
  maxAllowed?: number;
}

export const useEnhancedScoreManager = (sessionId?: string, gameType?: string) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [gameStartTime] = useState(Date.now());
  const [lastValidationTime, setLastValidationTime] = useState(0);
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);

  // Rate limiting for score updates (max 10 per second)
  const [scoreUpdateQueue, setScoreUpdateQueue] = useState<ScoreData[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Real-time score updates with validation
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('secure-score-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_scores',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📊 Real-time score update validated:', payload);
          const newData = payload.new as any;
          setCurrentScore(newData.real_time_score || 0);
          setComboMultiplier(newData.combo_multiplier || 1);
          setBonusPoints(newData.bonus_points || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Process score update queue with validation
  useEffect(() => {
    if (scoreUpdateQueue.length === 0 || isProcessingQueue) return;

    const processQueue = async () => {
      setIsProcessingQueue(true);
      
      try {
        while (scoreUpdateQueue.length > 0) {
          const scoreData = scoreUpdateQueue[0];
          const success = await validateAndUpdateScore(scoreData);
          
          if (success) {
            // Remove processed item from queue
            setScoreUpdateQueue(prev => prev.slice(1));
          } else {
            // Stop processing on validation failure
            console.warn('⚠️ Score validation failed, stopping queue processing');
            break;
          }
          
          // Rate limiting: wait 100ms between updates
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } finally {
        setIsProcessingQueue(false);
      }
    };

    processQueue();
  }, [scoreUpdateQueue, isProcessingQueue]);

  // Validate and update score securely
  const validateAndUpdateScore = async (scoreData: ScoreData): Promise<boolean> => {
    if (!sessionId || !gameType) {
      console.error('❌ Session ID and game type required for score validation');
      return false;
    }

    const timePlayed = (Date.now() - gameStartTime) / 1000;
    
    try {
      // Client-side validation first
      const validation = await scoreValidator.validateScore(
        scoreData.score,
        gameType,
        sessionId,
        timePlayed
      );

      // Track validation results
      setValidationHistory(prev => [...prev.slice(-9), validation]); // Keep last 10

      if (!validation.isValid) {
        console.error('🚫 Score validation failed:', validation.reason);
        toast.error(`Score validation failed: ${validation.reason}`, {
          duration: 5000
        });
        
        // Log security incident for high-risk scores
        if (validation.riskScore > 90) {
          await logSecurityIncident(scoreData, validation);
        }
        
        return false;
      }

      // Proceed with server-side update if validation passes
      const result = await updateScoreOnServer(scoreData);
      
      if (result) {
        // Update local state immediately for responsiveness
        setCurrentScore(scoreData.score);
        setComboMultiplier(scoreData.comboMultiplier);
        setBonusPoints(scoreData.bonusPoints);
        setLastValidationTime(Date.now());
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('💥 Score validation error:', error);
      return false;
    }
  };

  // Server-side score update with additional validation
  const updateScoreOnServer = async (scoreData: ScoreData): Promise<boolean> => {
    if (!sessionId || isUpdating) return false;
    
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_realtime_score', {
        p_session_id: sessionId,
        p_score: scoreData.score,
        p_combo_multiplier: scoreData.comboMultiplier,
        p_bonus_points: scoreData.bonusPoints
      });

      if (error) {
        console.error('❌ Server score update failed:', error);
        return false;
      }

      console.log('✅ Score updated and validated on server:', data);
      return true;
    } catch (error) {
      console.error('💥 Server score update error:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Log security incident for suspicious activity
  const logSecurityIncident = async (scoreData: ScoreData, validation: ValidationResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Convert validation object to JSON-compatible format
      const validationData = {
        isValid: validation.isValid,
        riskScore: validation.riskScore,
        reason: validation.reason || null,
        maxAllowed: validation.maxAllowed || null
      };

      await supabase
        .from('security_incidents')
        .insert({
          incident_type: 'score_manipulation',
          severity: validation.riskScore > 95 ? 'high' : 'medium',
          title: 'Suspicious Score Activity Detected',
          description: `Score validation failed with risk score ${validation.riskScore}: ${validation.reason}`,
          affected_user_id: user.id,
          incident_data: {
            score: scoreData.score,
            gameType,
            sessionId,
            validation: validationData,
            timePlayed: (Date.now() - gameStartTime) / 1000
          }
        });
    } catch (error) {
      console.error('Failed to log security incident:', error);
    }
  };

  // Queue score update for validation
  const updateScore = useCallback((scoreData: ScoreData): void => {
    // Rate limiting check - max 10 updates per second
    const now = Date.now();
    if (now - lastValidationTime < 100) {
      console.warn('⚠️ Score update rate limited');
      return;
    }

    // Add to queue for processing
    setScoreUpdateQueue(prev => [...prev, scoreData]);
  }, [lastValidationTime]);

  // Increase score with validation
  const addPoints = useCallback((points: number, isCombo: boolean = false) => {
    const multiplier = isCombo ? Math.min(comboMultiplier + 1, 10) : 1;
    const totalPoints = points * multiplier;
    
    const newScore = currentScore + totalPoints;
    const newCombo = isCombo ? multiplier : 1;
    
    updateScore({
      score: newScore,
      comboMultiplier: newCombo,
      bonusPoints: bonusPoints + (isCombo ? totalPoints - points : 0),
      timePlayed: (Date.now() - gameStartTime) / 1000
    });
  }, [currentScore, comboMultiplier, bonusPoints, updateScore, gameStartTime]);

  // Reset combo
  const resetCombo = useCallback(() => {
    setComboMultiplier(1);
    updateScore({
      score: currentScore,
      comboMultiplier: 1,
      bonusPoints: bonusPoints,
      timePlayed: (Date.now() - gameStartTime) / 1000
    });
  }, [currentScore, bonusPoints, updateScore, gameStartTime]);

  // Get security status
  const getSecurityStatus = useCallback(() => {
    const recentValidations = validationHistory.slice(-5);
    const averageRiskScore = recentValidations.length > 0 
      ? recentValidations.reduce((sum, v) => sum + v.riskScore, 0) / recentValidations.length 
      : 0;
    
    return {
      averageRiskScore,
      validationCount: validationHistory.length,
      lastValidation: lastValidationTime,
      queueLength: scoreUpdateQueue.length,
      status: averageRiskScore < 30 ? 'safe' : averageRiskScore < 60 ? 'moderate' : 'high-risk'
    };
  }, [validationHistory, lastValidationTime, scoreUpdateQueue.length]);

  return {
    currentScore,
    comboMultiplier,
    bonusPoints,
    addPoints,
    resetCombo,
    updateScore,
    isUpdating: isUpdating || isProcessingQueue,
    
    // Security features
    getSecurityStatus,
    validationHistory: validationHistory.slice(-5), // Return last 5 validations
    queueLength: scoreUpdateQueue.length
  };
};
