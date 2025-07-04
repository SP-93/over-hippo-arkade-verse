import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WalletConnection } from "@/components/WalletConnection";
import { PlayerDashboard } from "@/components/PlayerDashboard";
import { GameGrid } from "@/components/GameGrid";
import { ChipManager, ChipDisplay } from "@/components/ChipManager";
import { ChipPurchaseModal } from "@/components/ChipPurchaseModal";
import { HippoBackground } from "@/components/HippoBackground";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad, Wallet, Zap } from "lucide-react";
import { toast } from "sonner";
import heroLogo from "@/assets/hero-logo.jpg";

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletType, setWalletType] = useState<string>("");
  const [playerChips, setPlayerChips] = useState(5);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'games'>('home');
  const navigate = useNavigate();

  // Initialize chip manager
  const chipManager = ChipManager({ playerChips, onChipChange: setPlayerChips });

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

  const handleChipPurchase = (chips: number) => {
    setPlayerChips(prev => prev + chips);
    toast.success(`Dodano je ${chips} chipova u vaš račun!`);
  };

  const handlePlayGame = (gameId: string) => {
    if (!chipManager.canPlayGame(gameId)) {
      toast.error("Nemate dovoljno chipova za igru!");
      return;
    }
    
    if (chipManager.consumeChip(gameId)) {
      toast.success("Chip je potrošen! Uživajte u igri!");
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
          <div className="text-center space-y-8 animate-zoom-in">
            <div className="mb-8 hover-lift">
              <img 
                src={heroLogo} 
                alt="Over Hippo Arkade" 
                className="w-full max-w-2xl mx-auto rounded-2xl shadow-intense animate-glow border border-neon"
              />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-hero bg-clip-text text-transparent animate-gradient drop-shadow-lg">
                Over Hippo Arkade
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto backdrop-glass rounded-xl p-4 md:p-6 border border-neon hover-lift">
                The ultimate Web3 gaming platform where you play, earn, and dominate the arcade!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-12">
              <Card className="p-4 md:p-6 bg-gradient-card border-neon-pink hover:shadow-intense transition-all duration-500 hover-lift animate-pulse-border backdrop-glass game-card">
                <Gamepad className="h-10 md:h-12 w-10 md:w-12 text-neon-pink mx-auto mb-4 animate-float drop-shadow-lg" />
                <h3 className="text-lg md:text-xl font-bold mb-2 text-neon-pink">10+ Classic Games</h3>
                <p className="text-sm md:text-base text-muted-foreground">Play Tetris, Mario, Pac-Man and more retro favorites</p>
              </Card>

              <Card className="p-4 md:p-6 bg-gradient-card border-arcade-gold hover:shadow-intense transition-all duration-500 hover-lift animate-pulse-border backdrop-glass game-card">
                <Zap className="h-10 md:h-12 w-10 md:w-12 text-arcade-gold mx-auto mb-4 animate-neon-pulse drop-shadow-lg" />
                <h3 className="text-lg md:text-xl font-bold mb-2 text-arcade-gold">Play to Earn</h3>
                <p className="text-sm md:text-base text-muted-foreground">Earn points and exchange them for various tokens</p>
              </Card>

              <Card className="p-4 md:p-6 bg-gradient-card border-neon-blue hover:shadow-intense transition-all duration-500 hover-lift animate-pulse-border backdrop-glass game-card">
                <Wallet className="h-10 md:h-12 w-10 md:w-12 text-neon-blue mx-auto mb-4 animate-float drop-shadow-lg" />
                <h3 className="text-lg md:text-xl font-bold mb-2 text-neon-blue">Web3 Integration</h3>
                <p className="text-sm md:text-base text-muted-foreground">Connect MetaMask, OKX or any compatible wallet</p>
              </Card>
            </div>

            {!isWalletConnected && (
              <div className="mt-12 backdrop-glass rounded-2xl p-6 md:p-8 border border-neon shadow-glow animate-pulse-border hover-lift">
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
    <div className="min-h-screen bg-gradient-bg relative">
      {/* Animated hippo background */}
      <HippoBackground />
      
      {/* Content wrapper with higher z-index */}
      <div className="relative z-10">
        {/* Navigation */}
        {isWalletConnected && (
          <nav className="border-b border-border bg-gradient-card/90 backdrop-blur-lg sticky top-0 z-50 shadow-glow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 md:h-20">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <Button
                    variant={currentView === 'home' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('home')}
                    className="font-bold hover:shadow-glow transition-all duration-300 text-sm md:text-base px-3 md:px-4"
                  >
                    Home
                  </Button>
                  <Button
                    variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('dashboard')}
                    className="font-bold hover:shadow-glow transition-all duration-300 text-sm md:text-base px-3 md:px-4"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant={currentView === 'games' ? 'default' : 'ghost'}
                    onClick={() => setCurrentView('games')}
                    className="font-bold hover:shadow-glow transition-all duration-300 text-sm md:text-base px-3 md:px-4"
                  >
                    Games
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-4">
                  <ChipDisplay 
                    playerChips={playerChips} 
                    timeUntilReset={chipManager.getTimeUntilReset()} 
                  />
                  <ChipPurchaseModal 
                    isConnected={isWalletConnected}
                    onPurchase={handleChipPurchase}
                  />
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {renderCurrentView()}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-gradient-card/90 backdrop-blur-lg mt-20 shadow-glow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="text-center space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-bold text-primary drop-shadow-lg">Over Hippo Arkade</h3>
              <p className="text-xs md:text-sm text-muted-foreground backdrop-glass rounded-lg px-3 md:px-4 py-1 md:py-2 inline-block border border-neon max-w-md mx-auto">
                Powered by Over Protocol • Built for the Web3 Gaming Revolution
              </p>
              <p className="text-xs text-muted-foreground backdrop-glass rounded-lg px-2 md:px-3 py-1 inline-block border border-primary/30 break-all">
                Profit Wallet: 0x4deA071d64F77F2F94Ac1EB80D1b7b2681993477
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
