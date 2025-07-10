import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdvancedAnalyticsData {
  playerRetention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  gamePopularity: Array<{
    game_type: string;
    sessions: number;
    avg_score: number;
    total_players: number;
  }>;
  revenueMetrics: {
    totalRevenue: number;
    chipsSold: number;
    vipSubscriptions: number;
    averageSpend: number;
  };
  realTimeMetrics: {
    activePlayers: number;
    activeSessions: number;
    liveRevenue: number;
  };
  conversionFunnel: {
    visitors: number;
    signups: number;
    firstGame: number;
    returning: number;
    paying: number;
  };
}

export const useAdvancedAnalytics = () => {
  const [data, setData] = useState<AdvancedAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerRetention = async (period: string = 'week') => {
    const { data: retention, error } = await supabase
      .from('user_behavior_analytics')
      .select('user_id, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Calculate retention rates
    const dailyActive = new Set();
    const weeklyActive = new Set(); 
    const monthlyActive = new Set();

    const now = new Date();
    retention?.forEach(record => {
      const recordDate = new Date(record.created_at);
      const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) dailyActive.add(record.user_id);
      if (daysDiff <= 7) weeklyActive.add(record.user_id);
      if (daysDiff <= 30) monthlyActive.add(record.user_id);
    });

    return {
      daily: (dailyActive.size / (retention?.length || 1)) * 100,
      weekly: (weeklyActive.size / (retention?.length || 1)) * 100,
      monthly: (monthlyActive.size / (retention?.length || 1)) * 100,
    };
  };

  const fetchGamePopularity = async () => {
    const { data: sessions, error } = await supabase
      .from('game_sessions')
      .select('game_type, user_id, score')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const gameStats = sessions?.reduce((acc: any, session) => {
      if (!acc[session.game_type]) {
        acc[session.game_type] = {
          game_type: session.game_type,
          sessions: 0,
          total_score: 0,
          players: new Set(),
        };
      }
      
      acc[session.game_type].sessions++;
      acc[session.game_type].total_score += session.score || 0;
      acc[session.game_type].players.add(session.user_id);
      
      return acc;
    }, {});

    return Object.values(gameStats || {}).map((stat: any) => ({
      game_type: stat.game_type,
      sessions: stat.sessions,
      avg_score: Math.round(stat.total_score / stat.sessions),
      total_players: stat.players.size,
    }));
  };

  const fetchRevenueMetrics = async () => {
    const { data: transactions, error } = await supabase
      .from('chip_transactions')
      .select('chip_amount, over_amount, premium_type, transaction_type')
      .eq('transaction_type', 'purchase')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const revenue = transactions?.reduce((acc, tx) => {
      acc.totalRevenue += tx.over_amount || 0;
      acc.chipsSold += tx.chip_amount || 0;
      if (tx.premium_type === 'vip') acc.vipSubscriptions++;
      return acc;
    }, { totalRevenue: 0, chipsSold: 0, vipSubscriptions: 0 });

    return {
      ...revenue,
      averageSpend: revenue ? revenue.totalRevenue / (transactions?.length || 1) : 0,
    };
  };

  const fetchRealTimeMetrics = async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [activeSessions, recentTransactions] = await Promise.all([
      supabase
        .from('game_sessions')
        .select('user_id')
        .is('session_end', null)
        .gte('last_activity', fiveMinutesAgo.toISOString()),
      
      supabase
        .from('chip_transactions')
        .select('over_amount')
        .eq('transaction_type', 'purchase')
        .gte('created_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString())
    ]);

    return {
      activePlayers: new Set(activeSessions.data?.map(s => s.user_id) || []).size,
      activeSessions: activeSessions.data?.length || 0,
      liveRevenue: recentTransactions.data?.reduce((sum, tx) => sum + (tx.over_amount || 0), 0) || 0,
    };
  };

  const fetchConversionFunnel = async () => {
    const [profiles, sessions, transactions] = await Promise.all([
      supabase.from('profiles').select('user_id, created_at'),
      supabase.from('game_sessions').select('user_id').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('chip_transactions').select('user_id').eq('transaction_type', 'purchase')
    ]);

    const totalUsers = profiles.data?.length || 0;
    const playedGame = new Set(sessions.data?.map(s => s.user_id) || []).size;
    const paidUsers = new Set(transactions.data?.map(t => t.user_id) || []).size;

    return {
      visitors: Math.round(totalUsers * 1.2), // Estimate
      signups: totalUsers,
      firstGame: playedGame,
      returning: Math.round(playedGame * 0.6), // Estimate
      paying: paidUsers,
    };
  };

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [retention, popularity, revenue, realTime, funnel] = await Promise.all([
        fetchPlayerRetention(),
        fetchGamePopularity(),
        fetchRevenueMetrics(),
        fetchRealTimeMetrics(),
        fetchConversionFunnel(),
      ]);

      setData({
        playerRetention: retention,
        gamePopularity: popularity,
        revenueMetrics: revenue,
        realTimeMetrics: realTime,
        conversionFunnel: funnel,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const trackUserAction = async (action: string, details: any) => {
    try {
      await supabase.rpc('log_user_behavior', {
        p_action_type: action,
        p_action_details: details,
        p_session_id: details.sessionId || null,
      });
    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  };

  useEffect(() => {
    loadAnalytics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh: loadAnalytics,
    trackUserAction,
  };
};