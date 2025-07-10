import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThreatType = "sql_injection" | "xss" | "csrf" | "brute_force" | "data_breach" | "unauthorized_access";
type SeverityLevel = "low" | "medium" | "high" | "critical";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface SecurityThreat {
  id: string;
  type: ThreatType;
  severity: SeverityLevel;
  description: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
}

interface VulnerabilityResult {
  category: string;
  risk_level: RiskLevel;
  issues: string[];
  recommendations: string[];
}

export const useSecurityScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityResult[]>([]);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout>();

  // Real-time threat detection patterns
  const threatPatterns = {
    sql_injection: [
      /('|''|;\s*DROP\s+TABLE)/i,
      /(UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM)/i,
      /(\|\||&&|\|\s*\||&\s*&)/i
    ],
    xss: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript\s*:/gi,
      /on\w+\s*=\s*["\'][^"\']*["\']/gi
    ],
    csrf: [
      /(\btoken\b|\bcsrf\b|\bxsrf\b).*=.*[a-zA-Z0-9+\/]{20,}/i
    ],
    brute_force: [
      /^(admin|root|test|guest|password|123456)$/i
    ]
  };

  // Scan for vulnerabilities in real-time
  const scanForThreats = useCallback(async (inputData: string, source: string = "user_input") => {
    const detectedThreats: SecurityThreat[] = [];

    // Check each threat type
    Object.entries(threatPatterns).forEach(([type, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(inputData)) {
          detectedThreats.push({
            id: crypto.randomUUID(),
            type: type as ThreatType,
            severity: type === "sql_injection" ? "critical" : type === "xss" ? "high" : "medium",
            description: `Potential ${type.replace("_", " ")} detected in ${source}`,
            timestamp: new Date(),
            source,
            resolved: false
          });
        }
      });
    });

    if (detectedThreats.length > 0) {
      setThreats(prev => [...prev, ...detectedThreats]);
      
      // Log to security incidents
      try {
        await Promise.all(detectedThreats.map(threat => 
          supabase.from('security_incidents').insert({
            incident_type: 'threat_detected',
            severity: threat.severity,
            title: `Security Threat: ${threat.type}`,
            description: threat.description,
            incident_data: {
              threat_type: threat.type,
              source: threat.source,
              input_data: inputData.substring(0, 100), // Limited for security
              timestamp: threat.timestamp.toISOString()
            }
          })
        ));
      } catch (error) {
        console.error('Failed to log security threat:', error);
      }
    }

    return detectedThreats;
  }, []);

  // Comprehensive vulnerability assessment
  const runVulnerabilityAssessment = useCallback(async () => {
    setIsScanning(true);
    console.log('🔍 Running comprehensive security vulnerability assessment...');

    try {
      const results: VulnerabilityResult[] = [];

      // 1. Authentication Security Check
      const authVulns = await checkAuthenticationSecurity();
      results.push({
        category: "Authentication",
        risk_level: authVulns.hasWeakPasswords ? "high" : "medium",
        issues: authVulns.issues,
        recommendations: authVulns.recommendations
      });

      // 2. Data Protection Check
      const dataVulns = await checkDataProtection();
      results.push({
        category: "Data Protection", 
        risk_level: dataVulns.hasUnencryptedData ? "critical" : "low",
        issues: dataVulns.issues,
        recommendations: dataVulns.recommendations
      });

      // 3. Network Security Check
      const networkVulns = await checkNetworkSecurity();
      results.push({
        category: "Network Security",
        risk_level: networkVulns.hasInsecureConnections ? "high" : "low", 
        issues: networkVulns.issues,
        recommendations: networkVulns.recommendations
      });

      // 4. Access Control Check
      const accessVulns = await checkAccessControls();
      results.push({
        category: "Access Control",
        risk_level: accessVulns.hasWeakControls ? "medium" : "low",
        issues: accessVulns.issues,
        recommendations: accessVulns.recommendations
      });

      setVulnerabilities(results);
      setLastScan(new Date());

      // Log assessment completion
      await supabase.rpc('record_performance_metric', {
        p_metric_type: 'security',
        p_metric_name: 'vulnerability_assessment_completed',
        p_metric_value: results.length,
        p_metric_unit: 'vulnerabilities_found',
        p_tags: {
          total_categories: results.length,
          critical_issues: results.filter(r => r.risk_level === 'critical').length,
          high_issues: results.filter(r => r.risk_level === 'high').length
        }
      });

    } catch (error) {
      console.error('Vulnerability assessment failed:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Authentication security checks
  const checkAuthenticationSecurity = async () => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let hasWeakPasswords = false;

    // Check session security
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      issues.push("No active authentication session");
      recommendations.push("Implement proper session management");
    }

    // Check for weak password policies
    try {
      const { data: failedAttempts } = await supabase
        .from('auth_failed_attempts')
        .select('*')
        .gte('attempt_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (failedAttempts && failedAttempts.length > 10) {
        hasWeakPasswords = true;
        issues.push("High number of failed authentication attempts");
        recommendations.push("Implement stronger password policies and account lockout");
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }

    return { hasWeakPasswords, issues, recommendations };
  };

  // Data protection checks
  const checkDataProtection = async () => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let hasUnencryptedData = false;

    // Check for sensitive data exposure
    const localStorage = window.localStorage;
    const sensitiveKeys = ['password', 'token', 'key', 'secret'];
    
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key);
      if (value && sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        if (!value.startsWith('enc_')) { // Check if encrypted
          hasUnencryptedData = true;
          issues.push(`Potentially unencrypted sensitive data in localStorage: ${key}`);
          recommendations.push("Encrypt sensitive data before storing locally");
        }
      }
    });

    // Check HTTPS usage
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      hasUnencryptedData = true;
      issues.push("Application not served over HTTPS");
      recommendations.push("Always use HTTPS in production");
    }

    return { hasUnencryptedData, issues, recommendations };
  };

  // Network security checks
  const checkNetworkSecurity = async () => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let hasInsecureConnections = false;

    // Check CSP headers
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      hasInsecureConnections = true;
      issues.push("Missing Content Security Policy");
      recommendations.push("Implement strict CSP headers");
    }

    // Check for mixed content
    if (window.location.protocol === 'https:') {
      const scripts = document.querySelectorAll('script[src]');
      const links = document.querySelectorAll('link[href]');
      
      [...scripts, ...links].forEach(element => {
        const src = element.getAttribute('src') || element.getAttribute('href');
        if (src && src.startsWith('http://')) {
          hasInsecureConnections = true;
          issues.push("Mixed content detected: HTTP resources on HTTPS page");
          recommendations.push("Use HTTPS for all external resources");
        }
      });
    }

    return { hasInsecureConnections, issues, recommendations };
  };

  // Access control checks
  const checkAccessControls = async () => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let hasWeakControls = false;

    try {
      // Check admin access patterns
      const currentUrl = window.location.pathname;
      if (currentUrl.includes('/admin')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          hasWeakControls = true;
          issues.push("Admin area accessible without authentication");
          recommendations.push("Implement proper admin authentication checks");
        }
      }

      // Check for exposed development tools
      if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        issues.push("React DevTools detected (may expose sensitive information)");
        recommendations.push("Disable development tools in production");
      }

    } catch (error) {
      console.error('Access control check failed:', error);
    }

    return { hasWeakControls, issues, recommendations };
  };

  // Resolve threat
  const resolveThreat = useCallback(async (threatId: string) => {
    setThreats(prev => prev.map(threat => 
      threat.id === threatId ? { ...threat, resolved: true } : threat
    ));

    try {
      await supabase.from('security_incidents').insert({
        incident_type: 'threat_resolved',
        severity: 'low',
        title: 'Security Threat Resolved',
        description: `Threat ${threatId} has been manually resolved`,
        incident_data: { threat_id: threatId, resolved_at: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Failed to log threat resolution:', error);
    }
  }, []);

  // Auto-scan every 5 minutes
  useEffect(() => {
    scanIntervalRef.current = setInterval(() => {
      runVulnerabilityAssessment();
    }, 5 * 60 * 1000);

    // Initial scan
    runVulnerabilityAssessment();

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [runVulnerabilityAssessment]);

  return {
    isScanning,
    threats: threats.filter(t => !t.resolved),
    resolvedThreats: threats.filter(t => t.resolved),
    vulnerabilities,
    lastScan,
    scanForThreats,
    runVulnerabilityAssessment,
    resolveThreat
  };
};