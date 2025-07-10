import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminTabNavigation, AdminTab } from "@/components/admin/AdminTabNavigation";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function Admin() {
  const { isAuthenticated, isAdmin, loading, stats, loadStats } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  if (loading) {
    return <AdminLoadingState />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminLayout>
      <AdminHeader />
      <AdminTabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <AdminContent 
        activeTab={activeTab}
        isAdmin={isAdmin}
        stats={stats}
        onRefreshStats={loadStats}
      />
    </AdminLayout>
  );
}