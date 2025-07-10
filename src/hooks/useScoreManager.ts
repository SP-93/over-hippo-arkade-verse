import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScoreData {
  score: number;
  comboMultiplier: number;
  bonusPoints: number;
}

export const useScoreManager = (sessionId?: string) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Real-time score updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('score-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_scores',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📊 Real-time score update:', payload);
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

  // Update score in real-time
  const updateScore = useCallback(async (scoreData: ScoreData) => {
    if (!sessionId || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.rpc('update_realtime_score', {
        p_session_id: sessionId,
        p_score: scoreData.score,
        p_combo_multiplier: scoreData.comboMultiplier,
        p_bonus_points: scoreData.bonusPoints
      });

      if (error) {
        console.error('Score update failed:', error);
        return false;
      }

      // Update local state immediately for responsiveness
      setCurrentScore(scoreData.score);
      setComboMultiplier(scoreData.comboMultiplier);
      setBonusPoints(scoreData.bonusPoints);

      return true;
    } catch (error) {
      console.error('Score update error:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [sessionId, isUpdating]);

  // Increase score with combo system
  const addPoints = useCallback((points: number, isCombo: boolean = false) => {
    const multiplier = isCombo ? Math.min(comboMultiplier + 1, 10) : 1;
    const totalPoints = points * multiplier;
    
    const newScore = currentScore + totalPoints;
    const newCombo = isCombo ? multiplier : 1;
    
    updateScore({
      score: newScore,
      comboMultiplier: newCombo,
      bonusPoints: bonusPoints + (isCombo ? totalPoints - points : 0)
    });
  }, [currentScore, comboMultiplier, bonusPoints, updateScore]);

  // Reset combo
  const resetCombo = useCallback(() => {
    setComboMultiplier(1);
    updateScore({
      score: currentScore,
      comboMultiplier: 1,
      bonusPoints: bonusPoints
    });
  }, [currentScore, bonusPoints, updateScore]);

  return {
    currentScore,
    comboMultiplier,
    bonusPoints,
    addPoints,
    resetCombo,
    updateScore,
    isUpdating
  };
};