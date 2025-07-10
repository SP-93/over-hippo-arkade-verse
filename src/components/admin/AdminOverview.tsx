import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, Users, DollarSign, Trophy, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { secureAdminService, AdminStats } from "@/services/secure-admin";

interface AdminOverviewProps {
  isAdmin: boolean;
  stats: AdminStats | null;
  onRefreshStats: () => void;
}

export const AdminOverview = ({ isAdmin, stats, onRefreshStats }: AdminOverviewProps) => {
  const [chipAmount, setChipAmount] = useState(2);
  const [isAddingChips, setIsAddingChips] = useState(false);

  const handleAddChips = async () => {
    if (!isAdmin) {
      toast.error("Admin privileges required");
      return;
    }

    setIsAddingChips(true);
    try {
      console.log('🎯 FRONTEND: Starting chip addition process...');
      const success = await secureAdminService.addChipsToSelf(chipAmount);
      
      if (success) {
        toast.success(`Successfully added ${chipAmount} chips to your account!`);
        onRefreshStats();
      } else {
        toast.error("Failed to add chips");
      }
    } catch (error) {
      console.error('💥 FRONTEND: Chip addition failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to add chips");
    } finally {
      setIsAddingChips(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="p-6 bg-gradient-card border-destructive">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-destructive" />
          <div>
            <h3 className="text-lg font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">Admin privileges required to view overview.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-card border-primary">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-secondary">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-secondary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{stats?.totalRevenue || 0} OVER</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-accent">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Active Tournaments</p>
              <p className="text-2xl font-bold">{stats?.activeTournaments || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-primary">
          <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Chips in Circulation</p>
              <p className="text-2xl font-bold">{stats?.totalChipsInCirculation || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Actions */}
      <Card className="p-6 bg-gradient-card border-primary">
        <div className="flex items-center gap-3 mb-4">
          <Coins className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-primary">Admin Actions</h3>
            <p className="text-muted-foreground">Quick administrative operations</p>
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Add Chips to Self</label>
            <Input
              type="number"
              value={chipAmount}
              onChange={(e) => setChipAmount(parseInt(e.target.value) || 0)}
              min="1"
              max="100"
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleAddChips}
            disabled={isAddingChips || chipAmount <= 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isAddingChips ? "Adding..." : "🎯 Dodaj Cipove"}
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-6 bg-gradient-card">
        <h3 className="text-lg font-bold mb-4">Platform Status</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            Total Transactions: {stats?.totalTransactions || 0}
          </Badge>
          <Badge variant="secondary">
            Revenue: {stats?.totalRevenue || 0} OVER
          </Badge>
          <Badge variant={stats?.activeTournaments ? "default" : "outline"}>
            Tournaments: {stats?.activeTournaments || 0}
          </Badge>
        </div>
      </Card>
    </div>
  );
};