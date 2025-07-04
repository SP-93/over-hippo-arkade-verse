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
      toast.error("Potrebno je da povežete wallet za kupovinu!");
      return;
    }

    setIsPurchasing(true);
    
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onPurchase(chipPackage.chips);
      toast.success(`Uspešno ste kupili ${chipPackage.chips} chipova za ${chipPackage.price} Over Coin!`);
      setIsOpen(false);
    } catch (error) {
      toast.error("Greška pri kupovini chipova. Pokušajte ponovo.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Kupi Chipove
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-primary">Kupi Game Chipove</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isConnected && (
            <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <Wallet className="h-5 w-5" />
                <span className="font-medium">Potreban je wallet</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Povežite wallet da biste mogli kupiti chipove
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
                        <span className="font-bold text-lg">{pkg.chips} Chipova</span>
                        {pkg.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popularan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pkg.chips === 5 && "Osnovni paket"}
                        {pkg.chips === 10 && "Najbolja vrednost"}
                        {pkg.chips === 20 && "Premium paket"}
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
                      {isPurchasing ? "Kupujem..." : "Kupi"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Chipovi se troše za pokretanje igara. Svaka igra troši različit broj chipova.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};