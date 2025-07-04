import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Coins, Zap, Wallet } from "lucide-react";
import { toast } from "sonner";

interface ChipPackage {
  chips: number;
  price: number;
  popular?: boolean;
}

interface ChipPurchaseModalProps {
  isConnected: boolean;
  onPurchase: (chips: number) => void;
}

const chipPackages: ChipPackage[] = [
  { chips: 5, price: 5 },
  { chips: 10, price: 10, popular: true },
  { chips: 20, price: 17 }
];

export const ChipPurchaseModal = ({ isConnected, onPurchase }: ChipPurchaseModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (chipPackage: ChipPackage) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to purchase chips!");
      return;
    }

    setIsPurchasing(true);
    
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onPurchase(chipPackage.chips);
      toast.success(`Successfully purchased ${chipPackage.chips} chips for ${chipPackage.price} Over Coins!`);
      setIsOpen(false);
    } catch (error) {
      toast.error("Error purchasing chips. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Buy Chips
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-primary">Purchase Game Chips</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isConnected && (
            <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <Wallet className="h-5 w-5" />
                <span className="font-medium">Wallet Required</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your wallet to purchase chips
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {chipPackages.map((pkg, index) => (
              <Card 
                key={index} 
                className={`p-4 border-2 transition-all duration-300 hover:shadow-neon ${
                  pkg.popular 
                    ? 'border-primary bg-gradient-card' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-arcade-gold/20">
                      <Zap className="h-6 w-6 text-arcade-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{pkg.chips} Chips</span>
                        {pkg.popular && (
                          <Badge variant="secondary" className="text-xs">
                            BEST VALUE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pkg.chips === 5 && "Small Pack"}
                        {pkg.chips === 10 && "Medium Pack"}
                        {pkg.chips === 20 && "Large Pack"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Coins className="h-4 w-4" />
                      {pkg.price}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(pkg)}
                      disabled={!isConnected || isPurchasing}
                      className="mt-2"
                      variant={pkg.popular ? "default" : "outline"}
                    >
                      {isPurchasing ? "Purchasing..." : "Purchase"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Chips are consumed to start games. Each game costs different amount of chips.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};