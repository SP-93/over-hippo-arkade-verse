import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Settings, Wallet, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const ADMIN_WALLET = "0x88d26e867b289AD2e63A0BE905f9BC803A64F37f";

interface AdminPanelProps {
  walletAddress: string;
  isVisible: boolean;
}

export const AdminPanel = ({ walletAddress, isVisible }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="p-6 bg-gradient-card border-destructive shadow-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-destructive animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold text-destructive">Admin Panel</h2>
              <p className="text-sm text-muted-foreground">Platform Management Interface</p>
            </div>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            ADMIN ACCESS
          </Badge>
        </div>
      </Card>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Platform Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Deployed Contracts</p>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <p className="text-2xl font-bold text-neon-green">0 OVER</p>
                <p className="text-sm text-muted-foreground">Platform Balance</p>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <p className="text-2xl font-bold text-neon-blue">0</p>
                <p className="text-sm text-muted-foreground">Active Players</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Contract Management
            </h3>
            <p className="text-muted-foreground mb-4">Deploy and manage smart contracts</p>
            <Button variant="outline" disabled>
              Deploy ArcadeGameContract (Coming Soon)
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Token Management
            </h3>
            <p className="text-muted-foreground mb-4">Manage OVER tokens and platform economics</p>
            <Button variant="outline" disabled>
              Configure Token Settings (Coming Soon)
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Financial Controls
            </h3>
            <p className="text-muted-foreground mb-4">Monitor platform finances and withdrawals</p>
            <Button variant="outline" disabled>
              Financial Dashboard (Coming Soon)
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Transaction Signing</h3>
            <p className="text-muted-foreground mb-4">Manual review and signing of platform transactions</p>
            <Button variant="outline" disabled>
              Transaction Queue (Coming Soon)
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};