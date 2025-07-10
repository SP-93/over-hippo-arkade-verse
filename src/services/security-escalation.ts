import { supabase } from '@/integrations/supabase/client';

export interface EscalationRule {
  id: string;
  triggerType: 'rate_limit' | 'failed_attempts' | 'suspicious_pattern';
  threshold: number;
  timeWindow: number; // minutes
  action: 'warn' | 'temporary_block' | 'permanent_block' | 'admin_alert';
  escalationLevel: 1 | 2 | 3 | 4;
}

export interface SecurityIncident {
  id: string;
  walletAddress: string;
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionTime: string;
  details: any;
  escalationLevel: number;
  actions: string[];
  resolved: boolean;
}

export class SecurityEscalationService {
  private static instance: SecurityEscalationService;
  private escalationRules: EscalationRule[] = [
    {
      id: 'rate_limit_warning',
      triggerType: 'rate_limit',
      threshold: 8,
      timeWindow: 60,
      action: 'warn',
      escalationLevel: 1
    },
    {
      id: 'rate_limit_block',
      triggerType: 'rate_limit',
      threshold: 10,
      timeWindow: 60,
      action: 'temporary_block',
      escalationLevel: 2
    },
    {
      id: 'failed_attempts_warning',
      triggerType: 'failed_attempts',
      threshold: 3,
      timeWindow: 15,
      action: 'warn',
      escalationLevel: 1
    },
    {
      id: 'failed_attempts_block',
      triggerType: 'failed_attempts',
      threshold: 5,
      timeWindow: 15,
      action: 'temporary_block',
      escalationLevel: 2
    },
    {
      id: 'suspicious_pattern_alert',
      triggerType: 'suspicious_pattern',
      threshold: 1,
      timeWindow: 5,
      action: 'admin_alert',
      escalationLevel: 3
    }
  ];

  private activeIncidents: Map<string, SecurityIncident> = new Map();

  static getInstance(): SecurityEscalationService {
    if (!SecurityEscalationService.instance) {
      SecurityEscalationService.instance = new SecurityEscalationService();
    }
    return SecurityEscalationService.instance;
  }

  private constructor() {
    this.initializeMonitoring();
  }

  private async initializeMonitoring() {
    console.log('🛡️ Security Escalation Service initialized');
  }

  // Check for rate limit escalation
  async checkRateLimitEscalation(walletAddress: string, actionType: string, requestCount: number) {
    console.log(`🔍 Checking rate limit escalation for ${walletAddress}: ${requestCount} requests`);
    
    const rules = this.escalationRules.filter(rule => rule.triggerType === 'rate_limit');
    
    for (const rule of rules) {
      if (requestCount >= rule.threshold) {
        await this.triggerEscalation(walletAddress, rule, {
          actionType,
          requestCount,
          threshold: rule.threshold
        });
      }
    }
  }

  // Check for failed attempts escalation
  async checkFailedAttemptsEscalation(walletAddress: string, actionType: string) {
    const timeWindow = 15; // minutes
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindow);

    try {
      // Get failed attempts in time window
      const { data: failedAttempts, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('admin_wallet_address', walletAddress)
        .eq('action_type', actionType)
        .eq('success', false)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch failed attempts:', error);
        return;
      }

      const failedCount = failedAttempts?.length || 0;
      console.log(`🔍 Failed attempts for ${walletAddress}: ${failedCount} in last ${timeWindow} minutes`);

      const rules = this.escalationRules.filter(rule => rule.triggerType === 'failed_attempts');
      
      for (const rule of rules) {
        if (failedCount >= rule.threshold) {
          await this.triggerEscalation(walletAddress, rule, {
            actionType,
            failedCount,
            timeWindow,
            recentAttempts: failedAttempts?.slice(0, 5) // Last 5 attempts
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking failed attempts escalation:', error);
    }
  }

  // Detect suspicious patterns
  async detectSuspiciousPatterns(walletAddress: string, actionDetails: any) {
    const suspiciousPatterns = [
      // Multiple different action types in short time
      this.detectRapidActionVariation.bind(this),
      // Unusual timing patterns
      this.detectUnusualTiming.bind(this),
      // High-value operations
      this.detectHighValueOperations.bind(this)
    ];

    for (const detector of suspiciousPatterns) {
      const result = await detector(walletAddress, actionDetails);
      if (result.suspicious) {
        const rule = this.escalationRules.find(r => r.triggerType === 'suspicious_pattern');
        if (rule) {
          await this.triggerEscalation(walletAddress, rule, {
            pattern: result.pattern,
            details: result.details,
            actionDetails
          });
        }
      }
    }
  }

  private async detectRapidActionVariation(walletAddress: string, actionDetails: any) {
    const timeWindow = 5; // minutes
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindow);

    try {
      const { data: recentActions, error } = await supabase
        .from('admin_audit_log')
        .select('action_type, created_at')
        .eq('admin_wallet_address', walletAddress)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (error || !recentActions) return { suspicious: false };

      const uniqueActions = new Set(recentActions.map(action => action.action_type));
      
      if (uniqueActions.size >= 4 && recentActions.length >= 6) {
        return {
          suspicious: true,
          pattern: 'rapid_action_variation',
          details: {
            uniqueActionTypes: uniqueActions.size,
            totalActions: recentActions.length,
            timeWindow,
            actions: Array.from(uniqueActions)
          }
        };
      }
    } catch (error) {
      console.error('❌ Error detecting rapid action variation:', error);
    }

    return { suspicious: false };
  }

  private async detectUnusualTiming(walletAddress: string, actionDetails: any) {
    const now = new Date();
    const hour = now.getHours();
    
    // Flag activities during unusual hours (2 AM - 5 AM)
    if (hour >= 2 && hour <= 5) {
      return {
        suspicious: true,
        pattern: 'unusual_timing',
        details: {
          hour,
          timestamp: now.toISOString(),
          reason: 'Activity during unusual hours (2 AM - 5 AM)'
        }
      };
    }

    return { suspicious: false };
  }

  private async detectHighValueOperations(walletAddress: string, actionDetails: any) {
    if (actionDetails.chip_amount && actionDetails.chip_amount > 1000) {
      return {
        suspicious: true,
        pattern: 'high_value_operation',
        details: {
          chipAmount: actionDetails.chip_amount,
          threshold: 1000,
          reason: 'High-value chip operation detected'
        }
      };
    }

    return { suspicious: false };
  }

  // Trigger escalation action
  private async triggerEscalation(walletAddress: string, rule: EscalationRule, details: any) {
    const incidentId = `${rule.triggerType}_${walletAddress}_${Date.now()}`;
    
    console.log(`🚨 Triggering escalation: ${rule.action} for ${walletAddress}`);
    
    const incident: SecurityIncident = {
      id: incidentId,
      walletAddress,
      incidentType: rule.triggerType,
      severity: this.getSeverityFromEscalationLevel(rule.escalationLevel),
      detectionTime: new Date().toISOString(),
      details,
      escalationLevel: rule.escalationLevel,
      actions: [],
      resolved: false
    };

    // Execute escalation action
    switch (rule.action) {
      case 'warn':
        await this.executeWarning(incident);
        break;
      case 'temporary_block':
        await this.executeTemporaryBlock(incident);
        break;
      case 'permanent_block':
        await this.executePermanentBlock(incident);
        break;
      case 'admin_alert':
        await this.executeAdminAlert(incident);
        break;
    }

    this.activeIncidents.set(incidentId, incident);
  }

  private async executeWarning(incident: SecurityIncident) {
    console.log(`⚠️ Executing warning for ${incident.walletAddress}`);
    incident.actions.push(`Warning issued at ${new Date().toISOString()}`);
    
    // Log the warning
    await this.logSecurityAction(incident, 'warning_issued');
  }

  private async executeTemporaryBlock(incident: SecurityIncident) {
    console.log(`🚫 Executing temporary block for ${incident.walletAddress}`);
    
    const blockDuration = this.getBlockDuration(incident.escalationLevel);
    const blockedUntil = new Date();
    blockedUntil.setMinutes(blockedUntil.getMinutes() + blockDuration);

    try {
      // Update rate limit record to block the wallet
      const { error } = await supabase
        .from('admin_rate_limit')
        .update({
          blocked_until: blockedUntil.toISOString(),
          request_count: 999 // Mark as over limit
        })
        .eq('admin_wallet_address', incident.walletAddress);

      if (error) {
        console.error('❌ Failed to apply temporary block:', error);
      } else {
        incident.actions.push(`Temporary block applied until ${blockedUntil.toISOString()}`);
        await this.logSecurityAction(incident, 'temporary_block_applied');
      }
    } catch (error) {
      console.error('❌ Error executing temporary block:', error);
    }
  }

  private async executePermanentBlock(incident: SecurityIncident) {
    console.log(`🔒 Executing permanent block for ${incident.walletAddress}`);
    
    try {
      // Insert permanent block record
      const { error } = await supabase
        .from('admin_rate_limit')
        .upsert({
          admin_wallet_address: incident.walletAddress,
          action_type: 'permanent_block',
          blocked_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          request_count: 999
        });

      if (error) {
        console.error('❌ Failed to apply permanent block:', error);
      } else {
        incident.actions.push(`Permanent block applied at ${new Date().toISOString()}`);
        await this.logSecurityAction(incident, 'permanent_block_applied');
      }
    } catch (error) {
      console.error('❌ Error executing permanent block:', error);
    }
  }

  private async executeAdminAlert(incident: SecurityIncident) {
    console.log(`📢 Executing admin alert for ${incident.walletAddress}`);
    
    incident.actions.push(`Admin alert sent at ${new Date().toISOString()}`);
    await this.logSecurityAction(incident, 'admin_alert_sent');

    // The alert will be picked up by the real-time monitoring system
  }

  private async logSecurityAction(incident: SecurityIncident, action: string) {
    try {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_wallet_address: 'system',
          action_type: 'security_escalation',
          target_wallet_address: incident.walletAddress,
          action_details: {
            incidentId: incident.id,
            action,
            escalationLevel: incident.escalationLevel,
            incidentType: incident.incidentType,
            details: incident.details
          },
          success: true
        });
    } catch (error) {
      console.error('❌ Failed to log security action:', error);
    }
  }

  private getSeverityFromEscalationLevel(level: number): SecurityIncident['severity'] {
    switch (level) {
      case 1: return 'low';
      case 2: return 'medium';
      case 3: return 'high';
      case 4: return 'critical';
      default: return 'medium';
    }
  }

  private getBlockDuration(escalationLevel: number): number {
    switch (escalationLevel) {
      case 1: return 5; // 5 minutes
      case 2: return 15; // 15 minutes
      case 3: return 60; // 1 hour
      case 4: return 240; // 4 hours
      default: return 15;
    }
  }

  // Get active incidents
  getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.activeIncidents.values());
  }

  // Resolve incident
  resolveIncident(incidentId: string) {
    const incident = this.activeIncidents.get(incidentId);
    if (incident) {
      incident.resolved = true;
      incident.actions.push(`Resolved at ${new Date().toISOString()}`);
      console.log(`✅ Incident resolved: ${incidentId}`);
    }
  }
}

export const securityEscalationService = SecurityEscalationService.getInstance();