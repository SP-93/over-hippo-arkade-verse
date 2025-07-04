import { Card } from "@/components/ui/card";

export const GameInstructions = () => {
  return (
    <Card className="p-6 bg-gradient-card border-border">
      <h3 className="text-lg font-bold mb-4">Game Instructions</h3>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• Use arrow keys to navigate your character</p>
        <p>• Press spacebar for primary actions</p>
        <p>• Score points by completing objectives</p>
        <p>• Higher scores earn more points toward token exchanges</p>
        <p>• Game automatically saves your highest score</p>
      </div>
    </Card>
  );
};