import React from "react";
import { Button } from "@/components/ui/button";

export type AdminTab = 
  | "overview" 
  | "analytics" 
  | "advanced_analytics"
  | "wallets" 
  | "accounts" 
  | "compliance" 
  | "incidents" 
  | "audit" 
  | "security" 
  | "advanced_users" 
  | "maintenance" 
  | "privileges" 
  | "performance" 
  | "security_dashboard";

interface AdminTabNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabs = [
  { key: "overview", label: "Platform Overview" },
  { key: "analytics", label: "Analytics Dashboard" },
  { key: "advanced_analytics", label: "Advanced Analytics" },
  { key: "wallets", label: "Wallet Management" },
  { key: "accounts", label: "Account Security" },
  { key: "compliance", label: "Compliance Reports" },
  { key: "incidents", label: "Security Incidents" },
  { key: "audit", label: "Audit Log" },
  { key: "security", label: "Security Monitor" },
  { key: "advanced_users", label: "Advanced Users" },
  { key: "maintenance", label: "System Maintenance" },
  { key: "privileges", label: "Privilege Monitor" },
  { key: "performance", label: "Performance" },
  { key: "security_dashboard", label: "Security" },
] as const;

export const AdminTabNavigation: React.FC<AdminTabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          variant={activeTab === tab.key ? "default" : "outline"}
          onClick={() => onTabChange(tab.key as AdminTab)}
          className="animate-fade-in"
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
};