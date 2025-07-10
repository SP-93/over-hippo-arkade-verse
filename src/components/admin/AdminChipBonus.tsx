import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Coins } from "lucide-react";
import { toast } from "sonner";
import { secureAdminService } from "@/services/secure-admin";

export const AdminChipBonus = () => {
  const [bonusAmount, setBonusAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddBonus = async () => {
    try {
      setIsProcessing(true);
      console.log('🎁 ADMIN: Adding bonus chips:', bonusAmount);
      
      const success = await secureAdminService.addChipsToSelf(bonusAmount);
      
      if (success) {
        toast.success(`Successfully added ${bonusAmount} bonus chips!`);
        setBonusAmount(10); // Reset to default
      } else {
        toast.error("Failed to add bonus chips");
      }
    } catch (error) {
      console.error('❌ ADMIN: Bonus chip error:', error);
      toast.error("Error adding bonus chips: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-primary">
      <div className="flex items-center gap-3 mb-4">
        <Gift className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-bold text-primary">Admin Chip Bonus</h3>
          <p className="text-sm text-muted-foreground">
            Add extra chips to your admin account
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Admin Only
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-arcade-gold" />
          <span className="text-sm font-medium">Bonus Amount:</span>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="number"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(parseInt(e.target.value) || 1)}
            min="1"
            max="100"
            className="flex-1"
          />
          <Button 
            onClick={handleAddBonus}
            disabled={isProcessing || bonusAmount < 1}
            className="px-6"
          >
            {isProcessing ? 'Adding...' : 'Add Bonus'}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Only admin wallets can receive bonus chips beyond the base 3 chips
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[5, 10, 25].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => setBonusAmount(amount)}
              className="text-xs"
            >
              {amount}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};