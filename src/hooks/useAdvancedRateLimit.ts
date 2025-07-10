import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RateLimitRule {
  id: string;
  name: string;
  endpoint: string;
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
  enabled: boolean;
  priority: "low" | "medium" | "high" | "critical";
}

interface RateLimitViolation {
  id: string;
  rule: string;
  endpoint: string;
  ipAddress: string;
  userId?: string;
  requestCount: number;
  timestamp: Date;
  blocked: boolean;
  releaseTime?: Date;
}

interface RequestTracking {
  count: number;
  firstRequest: Date;
  lastRequest: Date;
  blocked: boolean;
  blockUntil?: Date;
}

export const useAdvancedRateLimit = () => {
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [violations, setViolations] = useState<RateLimitViolation[]>([]);
  const [requestTracker, setRequestTracker] = useState<Map<string, RequestTracking>>(new Map());
  const [isEnabled, setIsEnabled] = useState(true);
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // Default rate limit rules
  const defaultRules: RateLimitRule[] = [
    {
      id: "api-general",
      name: "General API Requests",
      endpoint: "/api/*",
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      blockDurationMs: 300000, // 5 minutes
      enabled: true,
      priority: "medium"
    },
    {
      id: "auth-login",
      name: "Authentication Attempts",
      endpoint: "/auth/login",
      maxRequests: 5,
      windowMs: 300000, // 5 minutes
      blockDurationMs: 900000, // 15 minutes
      enabled: true,
      priority: "high"
    },
    {
      id: "admin-access",
      name: "Admin Operations",
      endpoint: "/admin/*",
      maxRequests: 20,
      windowMs: 60000, // 1 minute
      blockDurationMs: 600000, // 10 minutes
      enabled: true,
      priority: "critical"
    },
    {
      id: "password-reset",
      name: "Password Reset Requests",
      endpoint: "/auth/reset-password",
      maxRequests: 3,
      windowMs: 3600000, // 1 hour
      blockDurationMs: 3600000, // 1 hour
      enabled: true,
      priority: "high"
    },
    {
      id: "data-export",
      name: "Data Export Operations",
      endpoint: "/export/*",
      maxRequests: 5,
      windowMs: 300000, // 5 minutes
      blockDurationMs: 1800000, // 30 minutes
      enabled: true,
      priority: "critical"
    }
  ];

  // Initialize default rules
  useEffect(() => {
    setRules(defaultRules);
  }, []);

  // Check if request should be rate limited
  const checkRateLimit = useCallback(async (
    endpoint: string,
    ipAddress: string,
    userId?: string
  ): Promise<{ allowed: boolean; rule?: RateLimitRule; violation?: RateLimitViolation }> => {
    if (!isEnabled) {
      return { allowed: true };
    }

    const now = new Date();
    const identifier = userId || ipAddress;

    // Find matching rule for endpoint
    const matchingRule = rules.find(rule =>
      rule.enabled && (
        endpoint.startsWith(rule.endpoint.replace('*', '')) ||
        new RegExp(rule.endpoint.replace('*', '.*')).test(endpoint)
      )
    );

    if (!matchingRule) {
      return { allowed: true };
    }

    const trackerKey = `${matchingRule.id}:${identifier}`;
    const currentTracking = requestTracker.get(trackerKey);

    // Check if currently blocked
    if (currentTracking?.blocked && currentTracking.blockUntil && currentTracking.blockUntil > now) {
      return { 
        allowed: false, 
        rule: matchingRule,
        violation: {
          id: crypto.randomUUID(),
          rule: matchingRule.name,
          endpoint,
          ipAddress,
          userId,
          requestCount: currentTracking.count,
          timestamp: now,
          blocked: true,
          releaseTime: currentTracking.blockUntil
        }
      };
    }

    // Reset tracking if window has expired or user was blocked but block expired
    if (!currentTracking || 
        (now.getTime() - currentTracking.firstRequest.getTime()) > matchingRule.windowMs ||
        (currentTracking.blocked && (!currentTracking.blockUntil || currentTracking.blockUntil <= now))) {
      
      const newTracking: RequestTracking = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
        blocked: false
      };
      
      setRequestTracker(prev => new Map(prev.set(trackerKey, newTracking)));
      return { allowed: true, rule: matchingRule };
    }

    // Increment request count
    const updatedTracking: RequestTracking = {
      ...currentTracking,
      count: currentTracking.count + 1,
      lastRequest: now
    };

    // Check if limit exceeded
    if (updatedTracking.count > matchingRule.maxRequests) {
      // Block the identifier
      updatedTracking.blocked = true;
      updatedTracking.blockUntil = new Date(now.getTime() + matchingRule.blockDurationMs);

      const violation: RateLimitViolation = {
        id: crypto.randomUUID(),
        rule: matchingRule.name,
        endpoint,
        ipAddress,
        userId,
        requestCount: updatedTracking.count,
        timestamp: now,
        blocked: true,
        releaseTime: updatedTracking.blockUntil
      };

      setViolations(prev => [violation, ...prev].slice(0, 100));
      setRequestTracker(prev => new Map(prev.set(trackerKey, updatedTracking)));

      // Log violation to database
      try {
        await supabase.from('security_incidents').insert({
          incident_type: 'rate_limit_violation',
          severity: matchingRule.priority === 'critical' ? 'high' : 'medium',
          title: `Rate Limit Exceeded: ${matchingRule.name}`,
          description: `${updatedTracking.count} requests in ${matchingRule.windowMs}ms window`,
          incident_data: {
            rule_id: matchingRule.id,
            rule_name: matchingRule.name,
            endpoint,
            ip_address: ipAddress,
            user_id: userId,
            request_count: updatedTracking.count,
            max_requests: matchingRule.maxRequests,
            window_ms: matchingRule.windowMs,
            block_duration_ms: matchingRule.blockDurationMs,
            blocked_until: updatedTracking.blockUntil.toISOString()
          }
        });
      } catch (error) {
        console.error('Failed to log rate limit violation:', error);
      }

      return { allowed: false, rule: matchingRule, violation };
    }

    setRequestTracker(prev => new Map(prev.set(trackerKey, updatedTracking)));
    return { allowed: true, rule: matchingRule };
  }, [isEnabled, rules, requestTracker]);

  // Add custom rate limit rule
  const addRule = useCallback((rule: Omit<RateLimitRule, 'id'>) => {
    const newRule: RateLimitRule = {
      ...rule,
      id: crypto.randomUUID()
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  // Update existing rule
  const updateRule = useCallback((ruleId: string, updates: Partial<RateLimitRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  // Remove rule
  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  // Manually unblock identifier
  const unblock = useCallback(async (identifier: string, ruleId?: string) => {
    const pattern = ruleId ? `${ruleId}:${identifier}` : identifier;
    
    setRequestTracker(prev => {
      const newMap = new Map(prev);
      
      // Find and unblock matching entries
      newMap.forEach((tracking, key) => {
        if (key.includes(pattern) || key.endsWith(`:${identifier}`)) {
          newMap.set(key, {
            ...tracking,
            blocked: false,
            blockUntil: undefined
          });
        }
      });
      
      return newMap;
    });

    // Log unblock action
    try {
      await supabase.from('security_incidents').insert({
        incident_type: 'rate_limit_unblock',
        severity: 'low',
        title: 'Rate Limit Manually Unblocked',
        description: `Identifier ${identifier} has been manually unblocked`,
        incident_data: {
          identifier,
          rule_id: ruleId,
          unblocked_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log unblock action:', error);
    }
  }, []);

  // Get current status for identifier
  const getStatus = useCallback((endpoint: string, identifier: string) => {
    const matchingRule = rules.find(rule => 
      rule.enabled && (
        endpoint.startsWith(rule.endpoint.replace('*', '')) ||
        new RegExp(rule.endpoint.replace('*', '.*')).test(endpoint)
      )
    );

    if (!matchingRule) {
      return { blocked: false, rule: null, tracking: null };
    }

    const trackerKey = `${matchingRule.id}:${identifier}`;
    const tracking = requestTracker.get(trackerKey);

    return {
      blocked: tracking?.blocked || false,
      rule: matchingRule,
      tracking
    };
  }, [rules, requestTracker]);

  // Cleanup expired blocks and old tracking data
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const now = new Date();
      
      setRequestTracker(prev => {
        const newMap = new Map();
        
        prev.forEach((tracking, key) => {
          // Keep tracking if not expired
          if (tracking.blocked && tracking.blockUntil && tracking.blockUntil > now) {
            newMap.set(key, tracking);
          } else if (!tracking.blocked && 
                     (now.getTime() - tracking.lastRequest.getTime()) < 24 * 60 * 60 * 1000) {
            // Keep non-blocked tracking for 24 hours
            newMap.set(key, tracking);
          }
        });
        
        return newMap;
      });

      // Clean old violations
      setViolations(prev => prev.filter(violation => 
        (now.getTime() - violation.timestamp.getTime()) < 24 * 60 * 60 * 1000
      ));
    }, 60 * 1000); // Run every minute

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  return {
    rules,
    violations,
    isEnabled,
    setIsEnabled,
    checkRateLimit,
    addRule,
    updateRule,
    removeRule,
    unblock,
    getStatus,
    currentBlocks: Array.from(requestTracker.entries())
      .filter(([_, tracking]) => tracking.blocked)
      .map(([key, tracking]) => ({ key, ...tracking }))
  };
};
