import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowLeft, Wallet, Info, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// WOVER Contract on Over Protocol
const WOVER_CONTRACT = "0x59c914C8ac6F212bb655737CC80d9Abc79A1e273";
const OVER_PROTOCOL_CHAIN_ID = 54176;
const OVER_PROTOCOL_RPC = "https://rpc.overprotocol.com";

export const Swap = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [overBalance, setOverBalance] = useState(0);
  const [woverBalance, setWoverBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState<'wrap' | 'unwrap'>('wrap');
  const [isLoading, setIsLoading] = useState(false);

  // Check wallet connection
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
          await checkNetwork();
          await loadBalances();
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error("MetaMask not found. Please install MetaMask to continue.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        await checkNetwork();
        await loadBalances();
        toast.success("Wallet connected successfully!");
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error("Failed to connect wallet: " + error.message);
    }
  };

  const checkNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== OVER_PROTOCOL_CHAIN_ID) {
        await switchToOverProtocol();
      }
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const switchToOverProtocol = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${OVER_PROTOCOL_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${OVER_PROTOCOL_CHAIN_ID.toString(16)}`,
              chainName: 'Over Protocol',
              nativeCurrency: {
                name: 'OVER',
                symbol: 'OVER',
                decimals: 18,
              },
              rpcUrls: [OVER_PROTOCOL_RPC],
              blockExplorerUrls: ['https://scan.over.network'],
            }],
          });
          toast.success("Over Protocol network added successfully!");
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast.error("Failed to add Over Protocol network");
        }
      } else {
        console.error('Error switching network:', switchError);
        toast.error("Failed to switch to Over Protocol network");
      }
    }
  };

  const loadBalances = async () => {
    try {
      // Load OVER balance (native token)
      const overBalanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });
      const overBalanceEth = parseFloat((window as any).web3?.utils?.fromWei(overBalanceWei, 'ether') || '0');
      setOverBalance(overBalanceEth);

      // Load WOVER balance (would need ABI and contract call)
      // For now, set to 0 - will implement proper ERC20 balance check
      setWoverBalance(0);
      
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const performSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    
    try {
      if (swapDirection === 'wrap') {
        await wrapOver();
      } else {
        await unwrapWover();
      }
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error("Swap failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const wrapOver = async () => {
    const amountWei = (window as any).web3?.utils?.toWei(amount, 'ether');
    
    // This would be the actual WOVER contract interaction
    // For now, showing the transaction structure
    const txParams = {
      to: WOVER_CONTRACT,
      from: walletAddress,
      value: amountWei,
      data: '0x' // deposit() function call data would go here
    };

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      
      toast.success(`Wrap transaction submitted! TX: ${txHash}`);
      await loadBalances();
      setAmount("");
    } catch (error) {
      throw error;
    }
  };

  const unwrapWover = async () => {
    const amountWei = (window as any).web3?.utils?.toWei(amount, 'ether');
    
    // This would be the actual WOVER contract interaction
    // For now, showing the transaction structure
    const txParams = {
      to: WOVER_CONTRACT,
      from: walletAddress,
      data: '0x' // withdraw(amount) function call data would go here
    };

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      
      toast.success(`Unwrap transaction submitted! TX: ${txHash}`);
      await loadBalances();
      setAmount("");
    } catch (error) {
      throw error;
    }
  };

  const toggleSwapDirection = () => {
    setSwapDirection(swapDirection === 'wrap' ? 'unwrap' : 'wrap');
    setAmount("");
  };

  const maxAmount = swapDirection === 'wrap' ? overBalance : woverBalance;

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">OVER ↔ WOVER Swap</h1>
        </div>

        {/* Wallet Connection */}
        {!isConnected ? (
          <Card className="p-6 bg-gradient-card border-primary mb-6">
            <div className="text-center space-y-4">
              <Wallet className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Connect Wallet</h3>
              <p className="text-muted-foreground">
                Connect your MetaMask wallet to start swapping
              </p>
              <Button onClick={connectWallet} className="w-full">
                Connect MetaMask
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Wallet Info */}
            <Card className="p-4 bg-gradient-card border-primary mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Wallet</p>
                  <p className="font-mono text-sm">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</p>
                </div>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Connected
                </Badge>
              </div>
            </Card>

            {/* Balances */}
            <Card className="p-4 bg-gradient-card border-primary mb-6">
              <h3 className="font-semibold mb-4">Your Balances</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{overBalance.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground">OVER</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{woverBalance.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground">WOVER</p>
                </div>
              </div>
            </Card>

            {/* Swap Interface */}
            <Card className="p-6 bg-gradient-card border-primary">
              <div className="space-y-4">
                {/* From Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">From</label>
                    <button 
                      onClick={() => setAmount(maxAmount.toString())}
                      className="text-xs text-primary hover:underline"
                    >
                      Max: {maxAmount.toFixed(4)}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Badge variant="secondary" className="px-4 py-2">
                      {swapDirection === 'wrap' ? 'OVER' : 'WOVER'}
                    </Badge>
                  </div>
                </div>

                {/* Swap Direction Toggle */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSwapDirection}
                    className="rounded-full p-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* To Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      readOnly
                      className="flex-1 bg-muted"
                    />
                    <Badge variant="secondary" className="px-4 py-2">
                      {swapDirection === 'wrap' ? 'WOVER' : 'OVER'}
                    </Badge>
                  </div>
                </div>

                {/* Swap Button */}
                <Button
                  onClick={performSwap}
                  disabled={!amount || parseFloat(amount) <= 0 || isLoading || parseFloat(amount) > maxAmount}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isLoading ? "Processing..." : `${swapDirection === 'wrap' ? 'Wrap' : 'Unwrap'} ${swapDirection === 'wrap' ? 'OVER → WOVER' : 'WOVER → OVER'}`}
                </Button>

                {/* Info */}
                <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg">
                  <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1">
                      {swapDirection === 'wrap' 
                        ? 'Wrapping converts your OVER tokens to WOVER (1:1 ratio)' 
                        : 'Unwrapping converts your WOVER tokens back to OVER (1:1 ratio)'
                      }
                    </p>
                    <p>Gas fees apply for transactions on Over Protocol network.</p>
                  </div>
                </div>

                {/* Contract Link */}
                <div className="text-center">
                  <a
                    href={`https://scan.over.network/address/${WOVER_CONTRACT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View WOVER Contract <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};