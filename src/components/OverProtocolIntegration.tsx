import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, ArrowUpDown, Wallet } from "lucide-react";
import { toast } from "sonner";

interface OverProtocolProps {
  walletAddress: string;
  overBalance: number;
  onPurchaseChips: (chipAmount: number, overCost: number) => void;
  onWithdrawTokens: (amount: number) => void;
}

export const OverProtocolIntegration = ({ 
  walletAddress, 
  overBalance, 
  onPurchaseChips,
  onWithdrawTokens 
}: OverProtocolProps) => {
  const [chipAmount, setChipAmount] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Exchange rates (these would be fetched from smart contract)
  const OVER_PER_CHIP = 0.1; // 0.1 OVER per chip
  const MIN_WITHDRAWAL = 1; // Minimum 1 OVER for withdrawal

  const handlePurchaseChips = async () => {
    const overCost = chipAmount * OVER_PER_CHIP;
    
    if (overBalance < overCost) {
      toast.error("Insufficient OVER tokens for this purchase!");
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the smart contract
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain transaction
      
      onPurchaseChips(chipAmount, overCost);
      toast.success(`Successfully purchased ${chipAmount} chips for ${overCost} OVER!`);
      setChipAmount(1);
    } catch (error) {
      toast.error("Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL} OVER`);
      return;
    }

    if (withdrawAmount > overBalance) {
      toast.error("Insufficient balance for withdrawal!");
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the smart contract
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate blockchain transaction
      
      onWithdrawTokens(withdrawAmount);
      toast.success(`Successfully withdrew ${withdrawAmount} OVER to your wallet!`);
      setWithdrawAmount(0);
    } catch (error) {
      toast.error("Withdrawal failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Over Protocol Status */}
      <Card className="p-4 bg-gradient-card border-arcade-gold animate-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-arcade-gold animate-neon-pulse" />
            <div>
              <p className="text-sm text-muted-foreground">OVER Balance</p>
              <p className="text-xl font-bold text-arcade-gold">{overBalance.toFixed(2)}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-arcade-gold/20 text-arcade-gold border-arcade-gold">
            Over Protocol
          </Badge>
        </div>
      </Card>

      {/* Purchase Chips */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default" className="w-full bg-gradient-primary hover:shadow-glow">
            <Zap className="h-4 w-4 mr-2" />
            Purchase Game Chips
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gradient-card border-primary">
          <DialogHeader>
            <DialogTitle className="text-primary">Purchase Game Chips with OVER</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">Chips to Purchase</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={chipAmount}
                  onChange={(e) => setChipAmount(parseInt(e.target.value) || 1)}
                  className="bg-input border-primary/30 text-primary"
                />
              </div>
              <div className="text-center">
                <ArrowUpDown className="h-6 w-6 text-primary mx-auto mb-2" />
                <Badge variant="outline" className="border-arcade-gold text-arcade-gold">
                  {(chipAmount * OVER_PER_CHIP).toFixed(2)} OVER
                </Badge>
              </div>
            </div>
            <div className="bg-muted/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Exchange Rate: 1 Chip = {OVER_PER_CHIP} OVER
              </p>
              <p className="text-xs text-muted-foreground">
                Each chip gives you 3 lives in any game
              </p>
            </div>
            <Button 
              onClick={handlePurchaseChips}
              disabled={isLoading || overBalance < (chipAmount * OVER_PER_CHIP)}
              className="w-full bg-gradient-primary hover:shadow-glow"
            >
              {isLoading ? "Processing..." : `Purchase ${chipAmount} Chips`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};