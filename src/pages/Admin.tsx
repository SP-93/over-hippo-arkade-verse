import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Ban } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { secureAdminService } from "@/services/secure-admin";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import { AdminSecurityMonitor } from "@/components/admin/AdminSecurityMonitor";
import { AccountManagement } from "@/components/admin/AccountManagement";
import { ComplianceReporting } from "@/components/admin/ComplianceReporting";
import { SecurityIncidentManager } from "@/components/admin/SecurityIncidentManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AdvancedUserManagement } from "@/components/admin/AdvancedUserManagement";
import { SystemMaintenancePanel } from "@/components/admin/SystemMaintenancePanel";
import { PrivilegeEscalationMonitor } from "@/components/admin/PrivilegeEscalationMonitor";
import { PerformanceDashboard } from "@/components/admin/PerformanceDashboard";
import { WalletAdminPanel } from "@/components/WalletAdminPanel";

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  activeTournaments: number;
  totalChipsInCirculation: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "wallets" | "accounts" | "compliance" | "incidents" | "audit" | "security" | "advanced_users" | "maintenance" | "privileges" | "performance">("overview");

  // Check authentication and admin status
  useEffect(() => {
    checkAuthAndAdmin();
  }, []);

  const checkAuthAndAdmin = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Authentication required");
        navigate("/");
        return;
      }

      setIsAuthenticated(true);

      // Check admin status
      const adminCheck = await secureAdminService.checkAdminStatus();
      
      if (!adminCheck.isAdmin) {
        toast.error("Admin privileges required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error("Auth/Admin check failed:", error);
      toast.error("Access verification failed");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const platformStats = await secureAdminService.getPlatformStats();
      setStats(platformStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast.error("Failed to load platform statistics");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <Card className="p-8 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div>
              <h3 className="text-lg font-bold">Verifying Access</h3>
              <p className="text-muted-foreground">Checking authentication and permissions...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <Card className="p-8 bg-gradient-card border-destructive">
          <div className="flex items-center gap-3">
            <Ban className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="text-xl font-bold text-destructive">Access Denied</h3>
              <p className="text-muted-foreground">You don't have permission to access this area.</p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="bg-background/50 hover:bg-background/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Game
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
                <p className="text-muted-foreground">Over Hippo Arcade Management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
          >
            Platform Overview
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics Dashboard
          </Button>
          <Button
            variant={activeTab === "wallets" ? "default" : "outline"}
            onClick={() => setActiveTab("wallets")}
          >
            Wallet Management
          </Button>
          <Button
            variant={activeTab === "accounts" ? "default" : "outline"}
            onClick={() => setActiveTab("accounts")}
          >
            Account Security
          </Button>
          <Button
            variant={activeTab === "compliance" ? "default" : "outline"}
            onClick={() => setActiveTab("compliance")}
          >
            Compliance Reports
          </Button>
          <Button
            variant={activeTab === "incidents" ? "default" : "outline"}
            onClick={() => setActiveTab("incidents")}
          >
            Security Incidents
          </Button>
          <Button
            variant={activeTab === "audit" ? "default" : "outline"}
            onClick={() => setActiveTab("audit")}
          >
            Audit Log
          </Button>
          <Button
            variant={activeTab === "security" ? "default" : "outline"}
            onClick={() => setActiveTab("security")}
          >
            Security Monitor
          </Button>
          <Button
            variant={activeTab === "advanced_users" ? "default" : "outline"}
            onClick={() => setActiveTab("advanced_users")}
          >
            Advanced Users
          </Button>
          <Button
            variant={activeTab === "maintenance" ? "default" : "outline"}
            onClick={() => setActiveTab("maintenance")}
          >
            System Maintenance
          </Button>
          <Button
            variant={activeTab === "privileges" ? "default" : "outline"}
            onClick={() => setActiveTab("privileges")}
          >
            Privilege Monitor
          </Button>
          <Button
            variant={activeTab === "performance" ? "default" : "outline"}
            onClick={() => setActiveTab("performance")}
          >
            Performance
          </Button>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <AdminOverview
            isAdmin={isAdmin}
            stats={stats}
            onRefreshStats={loadStats}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsDashboard />
        )}

        {activeTab === "wallets" && (
          <WalletAdminPanel isAdmin={isAdmin} />
        )}

        {activeTab === "accounts" && (
          <AccountManagement />
        )}

        {activeTab === "compliance" && (
          <ComplianceReporting />
        )}

        {activeTab === "incidents" && (
          <SecurityIncidentManager />
        )}

        {activeTab === "audit" && (
          <AdminAuditLog isAdmin={isAdmin} />
        )}

        {activeTab === "security" && (
          <AdminSecurityMonitor isAdmin={isAdmin} />
        )}

        {activeTab === "advanced_users" && (
          <AdvancedUserManagement isAdmin={isAdmin} />
        )}

        {activeTab === "maintenance" && (
          <SystemMaintenancePanel isAdmin={isAdmin} />
        )}

        {activeTab === "privileges" && (
          <PrivilegeEscalationMonitor isAdmin={isAdmin} />
        )}

        {activeTab === "performance" && (
          <PerformanceDashboard isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}