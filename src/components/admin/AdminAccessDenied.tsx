import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdminAccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
      <Card className="p-8 bg-gradient-card border-destructive animate-scale-in">
        <div className="flex items-center gap-3">
          <Ban className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-xl font-bold text-destructive">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to access this area.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="mt-4 hover-scale"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};