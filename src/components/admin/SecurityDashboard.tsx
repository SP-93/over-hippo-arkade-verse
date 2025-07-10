import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Eye, 
  Ban, 
  RefreshCw,
  Zap,
  Target,
  Clock
} from "lucide-react";
import { useSecurityScanner } from "@/hooks/useSecurityScanner";
import { useIntrusionDetection } from "@/hooks/useIntrusionDetection";
import { useAdvancedRateLimit } from "@/hooks/useAdvancedRateLimit";

interface SecurityDashboardProps {
  isAdmin: boolean;
}

export const SecurityDashboard = ({ isAdmin }: SecurityDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  
  const {
    isScanning,
    threats,
    vulnerabilities,
    lastScan,
    runVulnerabilityAssessment,
    resolveThreat
  } = useSecurityScanner();

  const {
    events: intrusionEvents,
    isMonitoring,
    setIsMonitoring,
    blockedIPs,
    unblockIP
  } = useIntrusionDetection();

  const {
    rules: rateLimitRules,
    violations: rateLimitViolations,
    isEnabled: rateLimitEnabled,
    setIsEnabled: setRateLimitEnabled,
    currentBlocks
  } = useAdvancedRateLimit();

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">Admin access required for Security Dashboard</span>
        </div>
      </Card>
    );
  }

  // Calculate overall security score
  const calculateSecurityScore = () => {
    let score = 100;
    
    // Deduct for active threats
    score -= threats.length * 10;
    
    // Deduct for vulnerabilities
    vulnerabilities.forEach(vuln => {
      switch(vuln.risk_level) {
        case 'critical': score -= 20; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });
    
    // Deduct for recent intrusion events
    const recentEvents = intrusionEvents.filter(e => 
      (Date.now() - e.timestamp.getTime()) < 24 * 60 * 60 * 1000
    );
    score -= recentEvents.length * 5;
    
    return Math.max(score, 0);
  };

  const securityScore = calculateSecurityScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Shield className="h-6 w-6 mr-2 text-primary" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">Real-time security monitoring and threat detection</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runVulnerabilityAssessment}
            disabled={isScanning}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            Scan Now
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Security Score</h3>
          <Badge variant={securityScore >= 80 ? "default" : securityScore >= 60 ? "secondary" : "destructive"}>
            {securityScore >= 80 ? "Excellent" : securityScore >= 60 ? "Good" : securityScore >= 40 ? "Warning" : "Critical"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Security</span>
              <span className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore}/100
              </span>
            </div>
            <Progress value={securityScore} className="h-3" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-destructive">{threats.length}</div>
              <div className="text-xs text-muted-foreground">Active Threats</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">{intrusionEvents.length}</div>
              <div className="text-xs text-muted-foreground">Intrusion Events</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-destructive" />
            <span className="font-medium">Threats Detected</span>
          </div>
          <div className="text-2xl font-bold text-destructive">{threats.length}</div>
          <div className="text-xs text-muted-foreground">
            {threats.filter(t => t.severity === 'critical').length} critical
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="h-4 w-4 text-orange-500" />
            <span className="font-medium">Intrusion Events</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">{intrusionEvents.length}</div>
          <div className="text-xs text-muted-foreground">
            Last 24 hours
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Ban className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">Blocked IPs</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">{blockedIPs.length}</div>
          <div className="text-xs text-muted-foreground">
            Currently blocked
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Rate Limits</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{rateLimitViolations.length}</div>
          <div className="text-xs text-muted-foreground">
            Violations today
          </div>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="intrusion">Intrusion</TabsTrigger>
          <TabsTrigger value="rate-limit">Rate Limits</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vulnerability Assessment */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Vulnerability Assessment</h3>
                <Badge variant="outline">
                  {isScanning ? "Scanning..." : lastScan ? `Last: ${lastScan.toLocaleTimeString()}` : "No scan"}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {vulnerabilities.map((vuln, index) => (
                  <div key={index} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{vuln.category}</span>
                      <Badge variant={
                        vuln.risk_level === 'critical' ? 'destructive' : 
                        vuln.risk_level === 'high' ? 'secondary' : 'outline'
                      }>
                        {vuln.risk_level}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vuln.issues.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {vuln.issues.slice(0, 2).map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                          {vuln.issues.length > 2 && (
                            <li>... and {vuln.issues.length - 2} more</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-green-600">No issues detected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Security Events */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Security Events</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {[...threats.slice(0, 3), ...intrusionEvents.slice(0, 3)]
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .slice(0, 5)
                  .map((event, index) => (
                  <div key={index} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {'type' in event ? event.type.replace('_', ' ') : 'Security Threat'}
                      </span>
                      <Badge variant={
                        event.severity === 'critical' ? 'destructive' : 
                        event.severity === 'high' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </span>
                      {'id' in event && 'resolved' in event && !event.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveThreat(event.id)}
                          className="text-xs px-2 py-1"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Active Security Threats</h3>
            {threats.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No active threats detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threats.map((threat) => (
                  <Card key={threat.id} className="p-4 border-l-4 border-l-destructive">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="font-medium">{threat.type.replace('_', ' ')}</span>
                        <Badge variant="destructive">{threat.severity}</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveThreat(threat.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{threat.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Source: {threat.source}</span>
                      <span>{threat.timestamp.toLocaleString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="intrusion" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Intrusion Detection System</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant={isMonitoring ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                <Activity className="h-4 w-4 mr-2" />
                {isMonitoring ? "Monitoring" : "Stopped"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-medium mb-4">Recent Intrusion Events</h4>
              <div className="space-y-3 max-h-96 overflow-auto">
                {intrusionEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{event.type.replace('_', ' ')}</span>
                      <Badge variant={
                        event.severity === 'critical' ? 'destructive' : 
                        event.severity === 'high' ? 'secondary' : 'outline'
                      }>
                        {event.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{event.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>IP: {event.ipAddress}</span>
                      <span>{event.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-medium mb-4">Blocked IP Addresses</h4>
              <div className="space-y-2">
                {blockedIPs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No IPs currently blocked</p>
                ) : (
                  blockedIPs.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                      <span className="font-mono text-sm">{ip}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unblockIP(ip)}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rate-limit" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Rate Limiting System</h3>
            <Button
              variant={rateLimitEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setRateLimitEnabled(!rateLimitEnabled)}
            >
              <Lock className="h-4 w-4 mr-2" />
              {rateLimitEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-medium mb-4">Rate Limit Rules</h4>
              <div className="space-y-3">
                {rateLimitRules.map((rule) => (
                  <div key={rule.id} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{rule.name}</span>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>Endpoint: {rule.endpoint}</div>
                      <div>Limit: {rule.maxRequests} requests per {rule.windowMs / 1000}s</div>
                      <div>Block duration: {rule.blockDurationMs / 1000 / 60} minutes</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-medium mb-4">Recent Violations</h4>
              <div className="space-y-2 max-h-96 overflow-auto">
                {rateLimitViolations.slice(0, 10).map((violation) => (
                  <div key={violation.id} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{violation.rule}</span>
                      <Badge variant="destructive">Blocked</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>IP: {violation.ipAddress}</div>
                      <div>Requests: {violation.requestCount}</div>
                      <div>{violation.timestamp.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Advanced security settings are managed through database configuration.
                  Contact system administrator for security policy changes.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Current Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Vulnerability Scanning: <Badge>Enabled</Badge></div>
                  <div>Intrusion Detection: <Badge variant={isMonitoring ? "default" : "secondary"}>
                    {isMonitoring ? "Active" : "Inactive"}
                  </Badge></div>
                  <div>Rate Limiting: <Badge variant={rateLimitEnabled ? "default" : "secondary"}>
                    {rateLimitEnabled ? "Enabled" : "Disabled"}
                  </Badge></div>
                  <div>Auto-blocking: <Badge>Enabled</Badge></div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};