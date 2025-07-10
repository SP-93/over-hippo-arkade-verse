import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Gift } from "lucide-react";
import { toast } from "sonner";
import { useSecureBalance } from "@/hooks/useSecureBalance";

interface WatchVideoButtonProps {
  onRewardEarned?: (reward: number) => void;
}

export const WatchVideoButton = ({ onRewardEarned }: WatchVideoButtonProps) => {
  const [isWatching, setIsWatching] = useState(false);
  const [dailyWatched, setDailyWatched] = useState(0);
  const maxDailyWatches = 5;
  const { addChips } = useSecureBalance();

  const handleWatchVideo = async () => {
    if (dailyWatched >= maxDailyWatches) {
      toast.error("Daily video limit reached! Come back tomorrow.");
      return;
    }

    setIsWatching(true);
    toast.info("Video starting... Please watch the full ad to earn chips!");
    
    // Simulate video watching (in real implementation, this would integrate with Google Ads)
    setTimeout(async () => {
      const reward = 1; // 1 extra chip per video
      
      try {
        // Actually add chips to secure balance
        const result = await addChips(reward, `video_reward_${Date.now()}`);
        
        if (result.success) {
          setDailyWatched(prev => prev + 1);
          setIsWatching(false);
          onRewardEarned?.(reward);
          toast.success(`Video completed! You earned ${reward} chip! Total: ${result.new_chips}`);
          
          // Trigger balance update events
          window.dispatchEvent(new Event('balanceUpdated'));
          window.dispatchEvent(new Event('chipBalanceUpdated'));
        } else {
          setIsWatching(false);
          toast.error(`Failed to add reward: ${result.error}`);
        }
      } catch (error) {
        setIsWatching(false);
        console.error('Video reward error:', error);
        toast.error("Failed to process video reward");
      }
    }, 3000); // 3 second simulation
  };

  return (
    <Card className="p-6 bg-gradient-card border-primary relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="bg-primary/20">
          {dailyWatched}/{maxDailyWatches} today
        </Badge>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <Gift className="h-8 w-8 text-primary animate-pulse" />
        <div>
          <h3 className="text-lg font-bold text-primary">Watch Video</h3>
          <p className="text-sm text-muted-foreground">Earn extra chips by watching ads</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-black text-arcade-gold">+1 Chip</p>
          <p className="text-xs text-muted-foreground">per video watched</p>
        </div>

        <Button 
          onClick={handleWatchVideo}
          disabled={isWatching || dailyWatched >= maxDailyWatches}
          variant="arcade"
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {isWatching ? 'Watching...' : 'Watch Video'}
        </Button>

        {dailyWatched >= maxDailyWatches && (
          <p className="text-center text-xs text-muted-foreground">
            Daily limit reached. Reset at midnight.
          </p>
        )}
      </div>
    </Card>
  );
};