import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WalletConnection } from "@/components/WalletConnection";
import { PlayerDashboard } from "@/components/PlayerDashboard";
import { GameGrid } from "@/components/GameGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad, Wallet, Zap } from "lucide-react";
import heroLogo from "@/assets/hero-logo.jpg";

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletType, setWalletType] = useState<string>("");
  const [playerChips, setPlayerChips] = useState(5);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'games'>('home');
  const navigate = useNavigate();

  // Load wallet state from localStorage on component mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet_connection');
    const savedChips = localStorage.getItem('player_chips');
    const savedView = localStorage.getItem('current_view');
    
    if (savedWallet) {
      const walletData = JSON.parse(savedWallet);
      setIsWalletConnected(walletData.isConnected);
      setWalletAddress(walletData.address);
      setWalletType(walletData.type);
    }
    
    if (savedChips) {
      setPlayerChips(parseInt(savedChips));
    }
    
    if (savedView && savedWallet) {
      setCurrentView(savedView as 'home' | 'dashboard' | 'games');
    }
  }, []);

  // Save wallet state to localStorage whenever it changes
  useEffect(() => {
    if (isWalletConnected) {
      localStorage.setItem('wallet_connection', JSON.stringify({
        isConnected: isWalletConnected,
        address: walletAddress,
        type: walletType
      }));
      localStorage.setItem('player_chips', playerChips.toString());
      localStorage.setItem('current_view', currentView);
    }
  }, [isWalletConnected, walletAddress, walletType, playerChips, currentView]);

  const handleWalletConnect = (connectedWalletType: string) => {
    setIsWalletConnected(true);
    setWalletAddress("0x742d35Cc6622C4532C3124d52C3F4A2cBe4267D8");
    setWalletType(connectedWalletType);
    setCurrentView('dashboard');
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    setWalletType("");
    setCurrentView('home');
    localStorage.removeItem('wallet_connection');
    localStorage.removeItem('player_chips');
    localStorage.removeItem('current_view');
  };

  const handlePlayGame = (gameId: string) => {
    if (playerChips > 0) {
      setPlayerChips(prev => prev - 1);
      navigate(`/game/${gameId}`);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <PlayerDashboard playerAddress={walletAddress} />;
      case 'games':
        return <GameGrid playerChips={playerChips} onPlayGame={handlePlayGame} />;
      default:
        return (
          <div className="text-center space-y-8">
            <div className="mb-8">
              <img 
                src={heroLogo} 
                alt="Over Hippo Arkade" 
                className="w-full max-w-2xl mx-auto rounded-2xl shadow-neon animate-glow"
              />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl font-black bg-gradient-primary bg-clip-text text-transparent animate-neon-pulse">
                Over Hippo Arkade
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The ultimate Web3 gaming platform where you play, earn, and dominate the arcade!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 bg-gradient-card border-neon-pink hover:shadow-neon transition-all duration-300">
                <Gamepad className="h-12 w-12 text-neon-pink mx-auto mb-4 animate-float" />
                <h3 className="text-xl font-bold mb-2">10+ Classic Games</h3>
                <p className="text-muted-foreground">Play Tetris, Mario, Pac-Man and more retro favorites</p>
              </Card>

              <Card className="p-6 bg-gradient-card border-arcade-gold hover:shadow-neon transition-all duration-300">
                <Zap className="h-12 w-12 text-arcade-gold mx-auto mb-4 animate-neon-pulse" />
                <h3 className="text-xl font-bold mb-2">Play to Earn</h3>
                <p className="text-muted-foreground">Earn points and exchange them for various tokens</p>
              </Card>

              <Card className="p-6 bg-gradient-card border-neon-blue hover:shadow-neon transition-all duration-300">
                <Wallet className="h-12 w-12 text-neon-blue mx-auto mb-4 animate-float" />
                <h3 className="text-xl font-bold mb-2">Web3 Integration</h3>
                <p className="text-muted-foreground">Connect MetaMask, OKX or any compatible wallet</p>
              </Card>
            </div>

            {!isWalletConnected && (
              <div className="mt-12">
                <WalletConnection 
                  onConnect={handleWalletConnect} 
                  onDisconnect={handleWalletDisconnect}
                  isConnected={isWalletConnected}
                  walletType={walletType}
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Navigation */}
      {isWalletConnected && (
        <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant={currentView === 'home' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('home')}
                  className="font-bold"
                >
                  Home
                </Button>
                <Button
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('dashboard')}
                  className="font-bold"
                >
                  Dashboard
                </Button>
                <Button
                  variant={currentView === 'games' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('games')}
                  className="font-bold"
                >
                  Games
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-arcade-gold border-arcade-gold">
                  <Zap className="h-4 w-4 mr-1" />
                  {playerChips} Chips
                </Badge>
                <WalletConnection 
                  onConnect={handleWalletConnect} 
                  onDisconnect={handleWalletDisconnect}
                  isConnected={isWalletConnected}
                  walletType={walletType}
                />
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-bold text-primary">Over Hippo Arkade</h3>
            <p className="text-sm text-muted-foreground">
              Powered by Over Protocol • Built for the Web3 Gaming Revolution
            </p>
            <p className="text-xs text-muted-foreground">
              Profit Wallet: 0x4deA071d64F77F2F94Ac1EB80D1b7b2681993477
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
