import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { secureAdminService } from '@/services/secure-admin';

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  activeTournaments: number;
  totalChipsInCirculation: number;
}

export const useAdminAuth = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

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

  useEffect(() => {
    checkAuthAndAdmin();
  }, []);

  return {
    isAuthenticated,
    isAdmin,
    loading,
    stats,
    loadStats,
  };
};