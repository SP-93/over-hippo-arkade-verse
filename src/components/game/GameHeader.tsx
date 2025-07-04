import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface GameHeaderProps {
  gameId?: string;
  onGoBack: () => void;
}

export const GameHeader = ({ gameId, onGoBack }: GameHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={onGoBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Arcade
      </Button>
      <Badge variant="outline" className="text-lg px-4 py-2">
        {gameId?.charAt(0).toUpperCase() + gameId?.slice(1)}
      </Badge>
    </div>
  );
};