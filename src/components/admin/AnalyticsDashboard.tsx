import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { 
  Activity, AlertTriangle, Users, TrendingUp, Shield, 
  BarChart3, Clock, CheckCircle, XCircle 
} from "lucide-react";
import { format } from "date-fns";
import { useComplianceAudit } from "@/hooks/useComplianceAudit";

export const AnalyticsDashboard: React.FC = () => {
  const { dashboardData, isLoading, loadDashboardData } = useComplianceAudit();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadDashboardData(selectedPeriod);
  }, [selectedPeriod, loadDashboardData]);

  const handlePeriodChange = (period: 'day' | 'week' | 'month') => {
    setSelectedPeriod(period);
  };

  // Chart colors
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))'];

  // Prepare chart data
  const riskScoreData = dashboardData?.behaviorAnalytics?.reduce((acc: any[], item: any) => {
    const date = format(new Date(item.created_at), 'MMM dd');
    const existingEntry = acc.find(entry => entry.date === date);
    
    if (existingEntry) {
      existingEntry.total += 1;
      if (item.risk_score > 70) existingEntry.highRisk += 1;
    } else {
      acc.push({
        date,
        total: 1,
        highRisk: item.risk_score > 70 ? 1 : 0
      });
    }
    
    return acc;
  }, []) || [];

  const severityDistribution = dashboardData?.securityIncidents?.reduce((acc: any[], item: any) => {
    const existingEntry = acc.find(entry => entry.name === item.severity);
    
    if (existingEntry) {
      existingEntry.value += 1;
    } else {
      acc.push({
        name: item.severity,
        value: 1
      });
    }
    
    return acc;
  }, []) || [];

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'totalActions':
        return <Activity className="h-4 w-4" />;
      case 'highRiskActions':
        return <AlertTriangle className="h-4 w-4" />;
      case 'openIncidents':
        return <Shield className="h-4 w-4" />;
      case 'riskScore':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getMetricColor = (type: string) => {
    switch (type) {
      case 'totalActions':
        return 'text-blue-600';
      case 'highRiskActions':
        return 'text-red-600';
      case 'openIncidents':
        return 'text-orange-600';
      case 'riskScore':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 80) return <Badge variant="destructive">Critical</Badge>;
    if (riskScore >= 60) return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
    if (riskScore >= 30) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {
    totalActions: 0,
    highRiskActions: 0,
    anomalies: 0,
    openIncidents: 0,
    criticalIncidents: 0,
    riskScore: 0
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Security and compliance analytics overview</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => loadDashboardData(selectedPeriod)}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{summary.totalActions.toLocaleString()}</p>
              </div>
              <div className={`${getMetricColor('totalActions')}`}>
                {getMetricIcon('totalActions')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk Actions</p>
                <p className="text-2xl font-bold">{summary.highRiskActions.toLocaleString()}</p>
              </div>
              <div className={`${getMetricColor('highRiskActions')}`}>
                {getMetricIcon('highRiskActions')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Incidents</p>
                <p className="text-2xl font-bold">{summary.openIncidents.toLocaleString()}</p>
              </div>
              <div className={`${getMetricColor('openIncidents')}`}>
                {getMetricIcon('openIncidents')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{summary.riskScore}%</p>
                  {getRiskBadge(summary.riskScore)}
                </div>
              </div>
              <div className={`${getMetricColor('riskScore')}`}>
                {getMetricIcon('riskScore')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Activity Trends</CardTitle>
            <CardDescription>Daily user actions and risk patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskScoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Actions" />
                <Bar dataKey="highRisk" fill="hsl(var(--destructive))" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Severity Distribution</CardTitle>
            <CardDescription>Breakdown of security incidents by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent High-Risk Activities</CardTitle>
            <CardDescription>Latest user actions flagged as high risk</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData?.behaviorAnalytics
                  ?.filter((item: any) => item.risk_score > 70)
                  ?.slice(0, 5)
                  ?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.action_type}</div>
                          {item.anomaly_detected && (
                            <Badge variant="destructive" className="mt-1">Anomaly</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.risk_score}</span>
                          {getRiskBadge(item.risk_score)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.created_at), "MMM dd, HH:mm")}
                      </TableCell>
                    </TableRow>
                  )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No high-risk activities found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Security Incidents</CardTitle>
            <CardDescription>Latest security incidents requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData?.securityIncidents
                  ?.slice(0, 5)
                  ?.map((incident: any) => (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{incident.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {incident.incident_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={incident.severity === 'critical' ? 'destructive' : 'outline'}
                          className={
                            incident.severity === 'high' ? 'bg-orange-500 hover:bg-orange-600' :
                            incident.severity === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' :
                            incident.severity === 'low' ? 'bg-gray-500 hover:bg-gray-600' :
                            ''
                          }
                        >
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {incident.status === 'open' && <XCircle className="h-3 w-3 text-red-500" />}
                          {incident.status === 'resolved' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {incident.status === 'investigating' && <Clock className="h-3 w-3 text-blue-500" />}
                          <span className="capitalize">{incident.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No security incidents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};