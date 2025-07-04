import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";

interface WalletConnectionProps {
  onConnect: (walletType: string) => void;
  isConnected: boolean;
}

export const WalletConnection = ({ onConnect, isConnected }: WalletConnectionProps) => {
  const [showQR, setShowQR] = useState(false);

  const connectMetaMask = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        onConnect('MetaMask');
        toast.success("MetaMask wallet connected!");
      } else {
        toast.error("MetaMask not found. Please install MetaMask extension.");
      }
    } catch (error) {
      toast.error("Failed to connect to MetaMask");
    }
  };

  const connectOKX = async () => {
    try {
      if (typeof window.okxwallet !== 'undefined') {
        await window.okxwallet.request({ method: 'eth_requestAccounts' });
        onConnect('OKX Web3');
        toast.success("OKX Web3 wallet connected!");
      } else {
        toast.error("OKX Web3 not found. Please install OKX Web3 extension.");
      }
    } catch (error) {
      toast.error("Failed to connect to OKX Web3");
    }
  };

  const connectWalletCode = () => {
    setShowQR(true);
    // Simulate QR code connection
    setTimeout(() => {
      onConnect('WalletConnect');
      setShowQR(false);
      toast.success("Wallet connected via QR code!");
    }, 3000);
  };

  if (isConnected) {
    return (
      <Card className="p-4 bg-gradient-card border-primary animate-glow">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-neon-green" />
          <span className="text-neon-green font-bold">Wallet Connected</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-foreground mb-4">
        Connect Your Wallet
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="neon"
          onClick={connectMetaMask}
          className="h-16 flex-col gap-2"
        >
          <Wallet className="h-6 w-6" />
          MetaMask
        </Button>
        
        <Button
          variant="secondary"
          onClick={connectOKX}
          className="h-16 flex-col gap-2"
        >
          <Wallet className="h-6 w-6" />
          OKX Web3
        </Button>
        
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={connectWalletCode}
              className="h-16 flex-col gap-2"
            >
              <QrCode className="h-6 w-6" />
              Wallet Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary">
            <DialogHeader>
              <DialogTitle className="text-center">Scan QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-8">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center animate-neon-pulse">
                <QrCode className="h-24 w-24 text-primary" />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              Scan this QR code with your mobile wallet app
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};