import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { QrCode, Wallet, LogOut, CheckCircle, AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { web3AuthService, WalletConnectionResult } from "@/services/web3-auth";
import { BlockchainBalanceDisplay } from "./BlockchainBalanceDisplay";
import { overProtocolBlockchainService } from "@/services/over-protocol-blockchain";

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
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isNetworkChecking, setIsNetworkChecking] = useState(false);

  // Check network status
  const checkNetworkStatus = async () => {
    setIsNetworkChecking(true);
    try {
      const info = await overProtocolBlockchainService.getDetailedNetworkInfo();
      setNetworkInfo(info);
      
      if (info && !info.isOverProtocol) {
        toast.warning("Please switch to Over Protocol network");
      }
    } catch (error) {
      console.error('Network check failed:', error);
    } finally {
      setIsNetworkChecking(false);
    }
  };

  // Check network status on mount and set up interval
  useEffect(() => {
    if (isConnected) {
      checkNetworkStatus();
      const interval = setInterval(checkNetworkStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const connectMetaMask = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        toast.error("MetaMask not found. Please install MetaMask extension.");
        return;
      }
      
      toast.loading("Connecting to MetaMask...");
      const result: WalletConnectionResult = await web3AuthService.connectMetaMask();
      
      if (result && result.verified) {
        onConnect('MetaMask', result.address, true);
        toast.success("MetaMask wallet connected and verified!");
      } else {
        toast.error("Wallet signature verification failed");
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      if (error.code === 4001 || error.message.includes('rejected')) {
        toast.error("Connection rejected by user");
      } else if (error.message.includes('not installed')) {
        toast.error("MetaMask not found. Please install MetaMask extension.");
      } else if (error.message.includes('logged in')) {
        toast.error("Please sign in first before connecting your wallet");
      } else if (error.message.includes('banned') || error.message.includes('already used')) {
        toast.error("This wallet is banned or already used by another user");
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
      } else if (error.message.includes('logged in')) {
        toast.error("Please sign in first before connecting your wallet");
      } else if (error.message.includes('banned') || error.message.includes('already used')) {
        toast.error("This wallet is banned or already used by another user");
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
      <div className="space-y-4">
        {/* Network Status Card */}
        {networkInfo && (
          <Card className="p-3 bg-gradient-card border-neon-blue">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {networkInfo.isOverProtocol ? (
                  <CheckCircle className="h-4 w-4 text-neon-green" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-arcade-gold" />
                )}
                <span className="text-sm font-medium">
                  {networkInfo.isOverProtocol ? 'Over Protocol Mainnet' : 'Wrong Network'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  networkInfo.networkHealth === 'healthy' 
                    ? 'border-neon-green text-neon-green'
                    : networkInfo.networkHealth === 'slow'
                    ? 'border-arcade-gold text-arcade-gold'
                    : 'border-red-500 text-red-500'
                }>
                  {networkInfo.networkHealth}
                </Badge>
                <Button
                  onClick={checkNetworkStatus}
                  disabled={isNetworkChecking}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={`h-3 w-3 ${isNetworkChecking ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {!networkInfo.isOverProtocol && (
              <div className="mt-2 text-sm text-arcade-gold">
                Please switch to Over Protocol network (Chain ID: 54176)
              </div>
            )}
          </Card>
        )}

        {/* Blockchain Balance Display */}
        <BlockchainBalanceDisplay 
          walletAddress={walletAddress} 
          onRefresh={checkNetworkStatus}
        />

        {/* Wallet Connection Status */}
        <Card className={`p-4 ${isVerified ? 'bg-gradient-card border-neon-green' : 'bg-gradient-card border-arcade-gold'} animate-glow`}>
          <div className="flex items-center gap-3">
            {isVerified ? (
              <CheckCircle className="h-5 w-5 text-neon-green" />
            ) : (
              <AlertCircle className="h-5 w-5 text-arcade-gold" />
            )}
            <div className="flex flex-col">
              <span className={`font-bold text-sm ${isVerified ? 'text-neon-green' : 'text-arcade-gold'}`}>
                {isVerified ? 'Verified Wallet' : 'Connected'}
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-white"
            style={{ textShadow: '0 0 10px #ec4899' }}>
          Connect Your Wallet
        </h3>
        <p className="text-cyan-300"
           style={{ textShadow: '0 0 5px #22d3ee' }}>
          Choose your preferred wallet to continue
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <div className="group">
          <Button
            onClick={connectMetaMask}
            disabled={isConnecting}
            className="w-full h-20 flex-col gap-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white hover:from-pink-500/30 hover:to-purple-500/30 transition-all duration-300 relative overflow-hidden"
            style={{ 
              filter: 'drop-shadow(0 0 10px #ec4899)',
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)'
            }}
          >
            <Wallet className="h-6 w-6" />
            <span className="font-bold">MetaMask</span>
            <span className="text-xs opacity-80">Sign to verify</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>
        
        <div className="group">
          <Button
            onClick={connectOKX}
            disabled={isConnecting}
            className="w-full h-20 flex-col gap-2 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-white hover:from-purple-500/30 hover:to-cyan-500/30 transition-all duration-300 relative overflow-hidden"
            style={{ 
              filter: 'drop-shadow(0 0 10px #a855f7)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
            }}
          >
            <Wallet className="h-6 w-6" />
            <span className="font-bold">OKX Web3</span>
            <span className="text-xs opacity-80">Sign to verify</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>
        
        <div className="group">
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button
                onClick={connectWalletCode}
                disabled={isConnecting}
                className="w-full h-20 flex-col gap-2 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 text-white hover:from-cyan-500/30 hover:to-pink-500/30 transition-all duration-300 relative overflow-hidden"
                style={{ 
                  filter: 'drop-shadow(0 0 10px #22d3ee)',
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)'
                }}
              >
                <QrCode className="h-6 w-6" />
                <span className="font-bold">WalletConnect</span>
                <span className="text-xs opacity-80">QR code scan</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-black/90 to-purple-900/90 border border-purple-500/30 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle className="text-center text-white"
                           style={{ textShadow: '0 0 10px #ec4899' }}>
                  Scan QR Code
                </DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-8">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center animate-pulse">
                  <QrCode className="h-24 w-24 text-cyan-300" />
                </div>
              </div>
              <p className="text-center text-cyan-200"
                 style={{ textShadow: '0 0 5px #22d3ee' }}>
                WalletConnect integration coming soon. Use browser extensions for now.
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};