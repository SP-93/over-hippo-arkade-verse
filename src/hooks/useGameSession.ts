import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useGameSession = () => {
  const startGameSession = async (gameType: string): Promise<{ sessionId?: string; livesRemaining: number; resumed: boolean } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Please log in to play!");
        return null;
      }

      const sessionToken = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const { data, error } = await supabase.rpc('start_game_session', {
        p_game_type: gameType,
        p_session_token: sessionToken
      });

      if (error) {
        console.error('Game session error:', error);
        toast.error("Failed to start game session");
        return null;
      }

      const sessionData = data as any;
      
      if (sessionData.error) {
        toast.error(sessionData.error);
        return null;
      }

      // Update UI messages based on session result
      if (sessionData.chip_consumed && !sessionData.resumed) {
        toast.success(`Chip consumed! You have 2 lives for this game.`);
      } else if (sessionData.resumed) {
        toast.info(`Game resumed! You have ${sessionData.lives_remaining} lives remaining.`);
      }

      // Store session info in localStorage for persistence
      localStorage.setItem('current_game_session', JSON.stringify({
        sessionId: sessionData.session_id,
        gameType,
        livesRemaining: sessionData.lives_remaining,
        sessionToken
      }));

      return {
        sessionId: sessionData.session_id,
        livesRemaining: sessionData.lives_remaining,
        resumed: sessionData.resumed
      };
    } catch (error) {
      console.error('Failed to start game session:', error);
      toast.error("Failed to start game session");
      return null;
    }
  };

  const loseLife = async (sessionId: string): Promise<{ livesRemaining: number; gameOver: boolean } | null> => {
    try {
      const { data, error } = await supabase.rpc('lose_life', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Lose life error:', error);
        return null;
      }

      const result = data as any;
      return {
        livesRemaining: result.lives_remaining,
        gameOver: result.game_over
      };
    } catch (error) {
      console.error('Failed to lose life:', error);
      return null;
    }
  };

  const endGameSession = async (sessionId: string, finalScore: number = 0): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('end_game_session', {
        p_session_id: sessionId,
        p_final_score: finalScore
      });

      if (error) {
        console.error('End game session error:', error);
        return false;
      }

      // Clear session from localStorage
      localStorage.removeItem('current_game_session');
      return data as boolean;
    } catch (error) {
      console.error('Failed to end game session:', error);
      return false;
    }
  };

  const getCurrentSession = () => {
    const sessionData = localStorage.getItem('current_game_session');
    return sessionData ? JSON.parse(sessionData) : null;
  };

  return {
    startGameSession,
    loseLife,
    endGameSession,
    getCurrentSession
  };
};