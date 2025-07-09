import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Wallet, LogOut, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { web3AuthService, WalletConnectionResult } from "@/services/web3-auth";

interface WalletConnectionProps {
  onConnect: (walletType: string, address: string, verified: boolean) => void;
  onDisconnect?: () => void;
  isConnected: boolean;
  walletType?: string;
  walletAddress?: string;
  isVerified?: boolean;
}

export const WalletConnection = ({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  walletType, 
  walletAddress, 
  isVerified 
}: WalletConnectionProps) => {
  const [showQR, setShowQR] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectMetaMask = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      toast.loading("Connecting to MetaMask...");
      const result: WalletConnectionResult = await web3AuthService.connectMetaMask();
      
      if (result.verified) {
        onConnect('MetaMask', result.address, true);
        toast.success("MetaMask wallet connected and verified!");
      } else {
        toast.error("Wallet signature verification failed");
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      if (error.message.includes('not installed')) {
        toast.error("MetaMask not found. Please install MetaMask extension.");
      } else if (error.message.includes('rejected')) {
        toast.error("Connection rejected by user");
      } else {
        toast.error("Failed to connect to MetaMask");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectOKX = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      toast.loading("Connecting to OKX Wallet...");
      const result: WalletConnectionResult = await web3AuthService.connectOKX();
      
      if (result.verified) {
        onConnect('OKX Web3', result.address, true);
        toast.success("OKX wallet connected and verified!");
      } else {
        toast.error("Wallet signature verification failed");
      }
    } catch (error: any) {
      console.error('OKX connection error:', error);
      if (error.message.includes('not installed')) {
        toast.error("OKX Wallet not found. Please install OKX Wallet extension.");
      } else if (error.message.includes('rejected')) {
        toast.error("Connection rejected by user");
      } else {
        toast.error("Failed to connect to OKX Wallet");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectWalletCode = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      toast.loading("Opening WalletConnect...");
      const { walletConnectService } = await import('@/services/wallet-connect');
      const result = await walletConnectService.openModal();
      
      if (result.verified) {
        onConnect('WalletConnect', result.address, true);
        toast.success("Wallet connected via WalletConnect!");
      } else {
        toast.error("Wallet signature verification failed");
      }
    } catch (error: any) {
      console.error('WalletConnect error:', error);
      if (error.message.includes('development')) {
        toast.info("WalletConnect integration in development - use browser extensions for now");
      } else {
        toast.error("Failed to connect via WalletConnect");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card className={`p-4 ${isVerified ? 'bg-gradient-card border-neon-green' : 'bg-gradient-card border-arcade-gold'} animate-glow`}>
        <div className="flex items-center gap-3">
          {isVerified ? (
            <CheckCircle className="h-5 w-5 text-neon-green" />
          ) : (
            <AlertCircle className="h-5 w-5 text-arcade-gold" />
          )}
          <div className="flex flex-col">
            <span className={`font-bold text-sm ${isVerified ? 'text-neon-green' : 'text-arcade-gold'}`}>
              {isVerified ? 'Verified' : 'Connected'}
            </span>
            <span className="text-xs text-muted-foreground">{walletType}</span>
            {walletAddress && (
              <span className="text-xs text-muted-foreground font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            )}
          </div>
          {onDisconnect && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDisconnect();
                toast.success("Wallet disconnected");
              }}
              className="h-8 w-8 p-0 ml-auto hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
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
          disabled={isConnecting}
          className="h-16 flex-col gap-2"
        >
          <Wallet className="h-6 w-6" />
          MetaMask
          <span className="text-xs opacity-80">Sign to verify</span>
        </Button>
        
        <Button
          variant="secondary"
          onClick={connectOKX}
          disabled={isConnecting}
          className="h-16 flex-col gap-2"
        >
          <Wallet className="h-6 w-6" />
          OKX Web3
          <span className="text-xs opacity-80">Sign to verify</span>
        </Button>
        
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              onClick={connectWalletCode}
              disabled={isConnecting}
              className="h-16 flex-col gap-2"
            >
              <QrCode className="h-6 w-6" />
              WalletConnect
              <span className="text-xs opacity-80">QR code scan</span>
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
              WalletConnect integration coming soon. Use browser extensions for now.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};