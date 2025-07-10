import React from "react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import { AdminSecurityMonitor } from "@/components/admin/AdminSecurityMonitor";
import { AccountManagement } from "@/components/admin/AccountManagement";
import { ComplianceReporting } from "@/components/admin/ComplianceReporting";
import { SecurityIncidentManager } from "@/components/admin/SecurityIncidentManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AdvancedAnalyticsDashboard } from "@/components/admin/AdvancedAnalyticsDashboard";
import { AdvancedUserManagement } from "@/components/admin/AdvancedUserManagement";
import { SystemMaintenancePanel } from "@/components/admin/SystemMaintenancePanel";
import { PrivilegeEscalationMonitor } from "@/components/admin/PrivilegeEscalationMonitor";
import { PerformanceDashboard } from "@/components/admin/PerformanceDashboard";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { WalletAdminPanel } from "@/components/WalletAdminPanel";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminBalanceDebugger } from "@/components/admin/AdminBalanceDebugger";
import { AdminTab } from "./AdminTabNavigation";

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  activeTournaments: number;
  totalChipsInCirculation: number;
}

interface AdminContentProps {
  activeTab: AdminTab;
  isAdmin: boolean;
  stats: AdminStats | null;
  onRefreshStats: () => Promise<void>;
}

export const AdminContent: React.FC<AdminContentProps> = ({
  activeTab,
  isAdmin,
  stats,
  onRefreshStats,
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <AdminBalanceDebugger isAdmin={isAdmin} />
            <AdminOverview
              isAdmin={isAdmin}
              stats={stats}
              onRefreshStats={onRefreshStats}
            />
          </div>
        );
      
      case "advanced_users":
        return (
          <div className="space-y-6">
            <AdminBalanceDebugger isAdmin={isAdmin} />
            <AdminUsers isAdmin={isAdmin} />
            <AdvancedUserManagement isAdmin={isAdmin} />
          </div>
        );
      
      case "maintenance":
        return <SystemMaintenancePanel isAdmin={isAdmin} />;
      
      case "privileges":
        return <PrivilegeEscalationMonitor isAdmin={isAdmin} />;
      
      case "performance":
        return <PerformanceDashboard isAdmin={isAdmin} />;
      
      case "security_dashboard":
        return <SecurityDashboard isAdmin={isAdmin} />;
      
      default:
        return (
          <AdminOverview
            isAdmin={isAdmin}
            stats={stats}
            onRefreshStats={onRefreshStats}
          />
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {renderContent()}
    </div>
  );
};