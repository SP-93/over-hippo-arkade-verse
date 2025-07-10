import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface IntrusionEvent {
  id: string;
  type: "suspicious_login" | "rate_limit_exceeded" | "unusual_activity" | "privilege_escalation" | "data_exfiltration";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: Date;
  userAgent: string;
  ipAddress: string;
  userId?: string;
  blocked: boolean;
}

interface ActivityPattern {
  userId?: string;
  ipAddress: string;
  actions: string[];
  timestamps: Date[];
  riskScore: number;
}

export const useIntrusionDetection = () => {
  const [events, setEvents] = useState<IntrusionEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());
  const [activityPatterns, setActivityPatterns] = useState<Map<string, ActivityPattern>>(new Map());
  const monitoringIntervalRef = useRef<NodeJS.Timeout>();

  // Risk scoring thresholds
  const RISK_THRESHOLDS = {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 90
  };

  // Suspicious activity detection
  const detectSuspiciousActivity = useCallback(async (
    action: string,
    userId?: string,
    metadata?: any
  ) => {
    const ipAddress = await getClientIP();
    const userAgent = navigator.userAgent;
    const patternKey = userId || ipAddress;

    // Update activity pattern
    const existingPattern = activityPatterns.get(patternKey) || {
      userId,
      ipAddress,
      actions: [],
      timestamps: [],
      riskScore: 0
    };

    existingPattern.actions.push(action);
    existingPattern.timestamps.push(new Date());

    // Keep only last 50 actions for analysis
    if (existingPattern.actions.length > 50) {
      existingPattern.actions = existingPattern.actions.slice(-50);
      existingPattern.timestamps = existingPattern.timestamps.slice(-50);
    }

    // Calculate risk score
    const riskScore = calculateRiskScore(existingPattern, action, metadata);
    existingPattern.riskScore = riskScore;

    setActivityPatterns(prev => new Map(prev.set(patternKey, existingPattern)));

    // Check if this activity is suspicious
    const event = await analyzeSuspiciousActivity(existingPattern, action, userAgent, ipAddress);
    if (event) {
      setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
      
      // Auto-block if critical
      if (event.severity === "critical") {
        await blockIP(ipAddress, `Critical intrusion detected: ${event.description}`);
      }

      // Log to database
      try {
        await supabase.from('security_incidents').insert({
          incident_type: 'intrusion_detected',
          severity: event.severity,
          title: `Intrusion Detection: ${event.type}`,
          description: event.description,
          incident_data: {
            event_type: event.type,
            ip_address: ipAddress,
            user_agent: userAgent,
            user_id: userId,
            risk_score: riskScore,
            action: action,
            metadata: metadata
          }
        });
      } catch (error) {
        console.error('Failed to log intrusion event:', error);
      }
    }

    return event;
  }, [activityPatterns]);

  // Calculate risk score based on activity patterns
  const calculateRiskScore = (pattern: ActivityPattern, action: string, metadata?: any): number => {
    let score = 0;

    // Time-based analysis
    const now = new Date();
    const recentActions = pattern.timestamps.filter(t => 
      (now.getTime() - t.getTime()) < 5 * 60 * 1000 // Last 5 minutes
    );

    // Rapid fire actions (high frequency)
    if (recentActions.length > 20) {
      score += 40;
    } else if (recentActions.length > 10) {
      score += 20;
    }

    // Unusual time patterns (3-6 AM activity)
    const hour = now.getHours();
    if (hour >= 3 && hour <= 6) {
      score += 15;
    }

    // Action-specific risk scoring
    const suspiciousActions = [
      'admin_login_attempt',
      'multiple_failed_logins', 
      'data_export',
      'privilege_change',
      'config_modification'
    ];

    if (suspiciousActions.includes(action)) {
      score += 30;
    }

    // Pattern analysis
    const uniqueActions = new Set(pattern.actions.slice(-10));
    if (uniqueActions.size < 3 && pattern.actions.length > 10) {
      score += 20; // Repetitive behavior
    }

    // Failed attempts pattern
    const failedAttempts = pattern.actions.filter(a => a.includes('failed')).length;
    if (failedAttempts > 5) {
      score += 25;
    }

    // Geographic anomaly (if available in metadata)
    if (metadata?.location && metadata.location !== 'expected_location') {
      score += 35;
    }

    return Math.min(score, 100);
  };

  // Analyze if activity is suspicious enough to create an event
  const analyzeSuspiciousActivity = async (
    pattern: ActivityPattern,
    action: string,
    userAgent: string,
    ipAddress: string
  ): Promise<IntrusionEvent | null> => {
    const { riskScore } = pattern;

    // Determine if we should create an event
    if (riskScore < RISK_THRESHOLDS.LOW) {
      return null;
    }

    let eventType: IntrusionEvent["type"] = "unusual_activity";
    let severity: IntrusionEvent["severity"] = "low";
    let description = "Unusual activity pattern detected";

    // Classify the type of intrusion
    if (action.includes('login') && riskScore > RISK_THRESHOLDS.MEDIUM) {
      eventType = "suspicious_login";
      description = "Suspicious login pattern detected";
    }

    if (action.includes('admin') && riskScore > RISK_THRESHOLDS.HIGH) {
      eventType = "privilege_escalation";
      description = "Potential privilege escalation attempt";
    }

    if (action.includes('export') || action.includes('download')) {
      eventType = "data_exfiltration";
      description = "Potential data exfiltration attempt";
    }

    // Set severity based on risk score
    if (riskScore >= RISK_THRESHOLDS.CRITICAL) {
      severity = "critical";
    } else if (riskScore >= RISK_THRESHOLDS.HIGH) {
      severity = "high";
    } else if (riskScore >= RISK_THRESHOLDS.MEDIUM) {
      severity = "medium";
    }

    return {
      id: crypto.randomUUID(),
      type: eventType,
      severity,
      description: `${description} (Risk Score: ${riskScore})`,
      timestamp: new Date(),
      userAgent,
      ipAddress,
      userId: pattern.userId,
      blocked: severity === "critical"
    };
  };

  // Get client IP (simplified - in real app would use proper service)
  const getClientIP = async (): Promise<string> => {
    try {
      // In a real application, you'd get this from your backend or IP service
      return "client.ip.placeholder";
    } catch {
      return "unknown";
    }
  };

  // Block IP address
  const blockIP = useCallback(async (ipAddress: string, reason: string) => {
    setBlockedIPs(prev => new Set(prev.add(ipAddress)));
    
    try {
      await supabase.from('security_incidents').insert({
        incident_type: 'ip_blocked',
        severity: 'high',
        title: 'IP Address Blocked',
        description: reason,
        incident_data: {
          ip_address: ipAddress,
          block_reason: reason,
          blocked_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log IP block:', error);
    }
  }, []);

  // Unblock IP address
  const unblockIP = useCallback(async (ipAddress: string) => {
    setBlockedIPs(prev => {
      const newSet = new Set(prev);
      newSet.delete(ipAddress);
      return newSet;
    });

    try {
      await supabase.from('security_incidents').insert({
        incident_type: 'ip_unblocked',
        severity: 'low',
        title: 'IP Address Unblocked',
        description: `IP ${ipAddress} has been unblocked`,
        incident_data: {
          ip_address: ipAddress,
          unblocked_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log IP unblock:', error);
    }
  }, []);

  // Clear old events (cleanup)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      setEvents(prev => prev.filter(event => event.timestamp > cutoff));
      
      // Clean up old patterns
      setActivityPatterns(prev => {
        const newMap = new Map();
        prev.forEach((pattern, key) => {
          const recentActivity = pattern.timestamps.some(t => t > cutoff);
          if (recentActivity) {
            newMap.set(key, pattern);
          }
        });
        return newMap;
      });
    }, 60 * 60 * 1000); // Run every hour

    return () => clearInterval(cleanup);
  }, []);

  // Monitor for rate limiting violations
  useEffect(() => {
    if (!isMonitoring) return;

    monitoringIntervalRef.current = setInterval(async () => {
      // Check for patterns that exceed normal thresholds
      activityPatterns.forEach(async (pattern, key) => {
        const recentActions = pattern.timestamps.filter(t => 
          (Date.now() - t.getTime()) < 60 * 1000 // Last minute
        );

        if (recentActions.length > 30) { // More than 30 actions per minute
          await detectSuspiciousActivity('rate_limit_exceeded', pattern.userId, {
            actions_per_minute: recentActions.length
          });
        }
      });
    }, 30 * 1000); // Check every 30 seconds

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [isMonitoring, activityPatterns, detectSuspiciousActivity]);

  return {
    events,
    isMonitoring,
    setIsMonitoring,
    blockedIPs: Array.from(blockedIPs),
    activityPatterns: Array.from(activityPatterns.values()),
    detectSuspiciousActivity,
    blockIP,
    unblockIP,
    getClientIP
  };
};
