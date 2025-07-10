import React from "react";
import { Card } from "@/components/ui/card";

export const AdminLoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
      <Card className="p-8 bg-gradient-card animate-scale-in">
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
};