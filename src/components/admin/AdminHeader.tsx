import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
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
  );
};