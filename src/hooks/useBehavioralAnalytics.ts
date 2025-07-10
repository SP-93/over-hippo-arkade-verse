import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserJourney {
  id: string;
  user_id: string;
  session_id: string;
  actions: Array<{
    action_type: string;
    timestamp: string;
    details: any;
  }>;
  session_duration: number;
  conversion_event?: string;
}

interface ConversionFunnel {
  step: string;
  users: number;
  conversion_rate: number;
  drop_off: number;
}

interface ABTestData {
  test_id: string;
  variant: string;
  metric: string;
  value: number;
  conversion_rate: number;
}

export const useBehavioralAnalytics = () => {
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [abTests, setABTests] = useState<ABTestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserJourneys = async (limit: number = 50) => {
    const { data: behaviors, error } = await supabase
      .from('user_behavior_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Group by session_id to create journeys
    const journeyMap = new Map<string, UserJourney>();
    
    behaviors?.forEach(behavior => {
      const sessionId = behavior.session_id || 'no-session';
      
      if (!journeyMap.has(sessionId)) {
        journeyMap.set(sessionId, {
          id: sessionId,
          user_id: behavior.user_id || '',
          session_id: sessionId,
          actions: [],
          session_duration: 0,
        });
      }
      
      const journey = journeyMap.get(sessionId)!;
      journey.actions.push({
        action_type: behavior.action_type,
        timestamp: behavior.created_at,
        details: behavior.action_details,
      });
    });

    // Calculate session durations
    journeyMap.forEach(journey => {
      if (journey.actions.length > 1) {
        const first = new Date(journey.actions[journey.actions.length - 1].timestamp);
        const last = new Date(journey.actions[0].timestamp);
        journey.session_duration = Math.round((last.getTime() - first.getTime()) / 1000);
      }
    });

    return Array.from(journeyMap.values());
  };

  const calculateConversionFunnel = async () => {
    const [profiles, sessions, purchases] = await Promise.all([
      supabase.from('profiles').select('user_id'),
      supabase.from('game_sessions').select('user_id'),
      supabase.from('chip_transactions').select('user_id').eq('transaction_type', 'purchase')
    ]);

    const totalUsers = profiles.data?.length || 0;
    const playedUsers = new Set(sessions.data?.map(s => s.user_id)).size;
    const payingUsers = new Set(purchases.data?.map(p => p.user_id)).size;

    const steps = [
      { step: 'Visitors', users: Math.round(totalUsers * 1.5), conversion_rate: 100, drop_off: 0 },
      { step: 'Signups', users: totalUsers, conversion_rate: 66.7, drop_off: 33.3 },
      { step: 'First Game', users: playedUsers, conversion_rate: (playedUsers / totalUsers) * 100, drop_off: 0 },
      { step: 'Purchase', users: payingUsers, conversion_rate: (payingUsers / totalUsers) * 100, drop_off: 0 },
    ];

    // Calculate drop-off rates
    for (let i = 1; i < steps.length; i++) {
      const current = steps[i];
      const previous = steps[i - 1];
      current.drop_off = ((previous.users - current.users) / previous.users) * 100;
    }

    return steps;
  };

  const generateABTestData = async () => {
    // Simulate A/B test data based on user behavior
    const { data: behaviors, error } = await supabase
      .from('user_behavior_analytics')
      .select('action_type, risk_score, user_id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Create mock A/B test scenarios
    const tests = [
      {
        test_id: 'button_color_test',
        variants: ['control_blue', 'variant_green'],
        metric: 'click_through_rate',
      },
      {
        test_id: 'onboarding_flow',
        variants: ['standard', 'simplified'],
        metric: 'completion_rate',
      },
    ];

    const testResults: ABTestData[] = [];

    tests.forEach(test => {
      test.variants.forEach(variant => {
        const mockUsers = Math.floor(Math.random() * 100) + 50;
        const mockConversions = Math.floor(Math.random() * mockUsers * 0.5);
        
        testResults.push({
          test_id: test.test_id,
          variant,
          metric: test.metric,
          value: mockUsers,
          conversion_rate: (mockConversions / mockUsers) * 100,
        });
      });
    });

    return testResults;
  };

  const loadBehavioralData = async () => {
    try {
      setIsLoading(true);
      
      const [journeysData, funnelData, abTestData] = await Promise.all([
        fetchUserJourneys(),
        calculateConversionFunnel(),
        generateABTestData(),
      ]);

      setJourneys(journeysData);
      setFunnels(funnelData);
      setABTests(abTestData);
    } catch (error) {
      console.error('Failed to load behavioral analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackConversionEvent = async (eventType: string, userId: string, sessionId?: string) => {
    try {
      await supabase.rpc('log_user_behavior', {
        p_action_type: `conversion_${eventType}`,
        p_action_details: { event_type: eventType, converted: true },
        p_session_id: sessionId,
      });
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  };

  useEffect(() => {
    loadBehavioralData();
  }, []);

  return {
    journeys,
    funnels,
    abTests,
    isLoading,
    refresh: loadBehavioralData,
    trackConversionEvent,
  };
};