import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Gamepad2, Box } from "lucide-react";

interface GameModeToggleProps {
  onModeChange: (is3D: boolean) => void;
  currentMode: boolean; // true for 3D, false for 2D
}

export const GameModeToggle = ({ onModeChange, currentMode }: GameModeToggleProps) => {
  return (
    <Card className="p-4 bg-gradient-card border-neon-pink mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-neon-pink" />
          <span className="text-sm font-medium">Game Mode</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={!currentMode ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange(false)}
            className="text-xs"
          >
            <Gamepad2 className="h-4 w-4 mr-1" />
            2D Classic
          </Button>
          
          <Button
            variant={currentMode ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange(true)}
            className="text-xs"
          >
            <Box className="h-4 w-4 mr-1" />
            3D Nintendo
          </Button>
          
          {currentMode && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              3D Mode
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};