import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Users, DollarSign, Download, RefreshCw } from "lucide-react";
import { useAdvancedAnalytics } from "@/hooks/useAdvancedAnalytics";
import { useBehavioralAnalytics } from "@/hooks/useBehavioralAnalytics";
import { useReportingSystem } from "@/hooks/useReportingSystem";

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading, refresh: refreshAnalytics } = useAdvancedAnalytics();
  const { funnels, abTests, isLoading: behaviorLoading } = useBehavioralAnalytics();
  const { generateReport, exportReport, reports, isGenerating } = useReportingSystem();

  const [activeTab, setActiveTab] = useState("overview");

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const handleGenerateReport = async () => {
    await generateReport({
      id: crypto.randomUUID(),
      name: 'Weekly Analytics Report',
      type: 'player_activity',
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    });
  };

  if (analyticsLoading || behaviorLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive platform analytics and insights</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAnalytics} disabled={analyticsLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Players</p>
                <p className="text-2xl font-bold">{analytics?.realTimeMetrics.activePlayers || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Live Revenue</p>
                <p className="text-2xl font-bold">{analytics?.realTimeMetrics.liveRevenue || 0} OVER</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold">{Math.round(analytics?.playerRetention.weekly || 0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{analytics?.revenueMetrics.totalRevenue || 0} OVER</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Popularity</CardTitle>
                <CardDescription>Sessions by game type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.gamePopularity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Player Retention</CardTitle>
                <CardDescription>Retention rates over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Retention</span>
                    <span>{Math.round(analytics?.playerRetention.daily || 0)}%</span>
                  </div>
                  <Progress value={analytics?.playerRetention.daily || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Weekly Retention</span>
                    <span>{Math.round(analytics?.playerRetention.weekly || 0)}%</span>
                  </div>
                  <Progress value={analytics?.playerRetention.weekly || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Retention</span>
                    <span>{Math.round(analytics?.playerRetention.monthly || 0)}%</span>
                  </div>
                  <Progress value={analytics?.playerRetention.monthly || 0} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User conversion through the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnels.map((step, index) => (
                  <div key={step.step} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{step.step}</p>
                        <p className="text-sm text-muted-foreground">{step.users.toLocaleString()} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{Math.round(step.conversion_rate)}%</Badge>
                      {step.drop_off > 0 && (
                        <p className="text-sm text-destructive">-{Math.round(step.drop_off)}% drop-off</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Generated Reports</h3>
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "New Report"}
            </Button>
          </div>
          
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Generated: {new Date(report.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => exportReport(report, 'json')}>
                        Export JSON
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportReport(report, 'csv')}>
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};