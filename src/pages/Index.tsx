import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WalletConnection } from "@/components/WalletConnection";
import { PlayerDashboard } from "@/components/PlayerDashboard";
import { GameGrid } from "@/components/GameGrid";
import { ChipDisplay } from "@/components/ChipManager";
import { ChipPurchaseModal } from "@/components/ChipPurchaseModal";
import { OverProtocolIntegration } from "@/components/OverProtocolIntegration";
import { HippoBackground } from "@/components/HippoBackground";
import { AdminPanel } from "@/components/AdminPanel";
import { AuthPage } from "@/components/AuthPage";
import { useChipManager } from "@/hooks/useChipManager";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad, Wallet, Zap, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import heroLogo from "@/assets/hero-logo.jpg";
import { useQuery } from "@tanstack/react-query";
import { secureAdminService } from "@/services/secure-admin";
import { supabase } from "@/integrations/supabase/client";

// Admin wallet now managed securely in backend

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletType, setWalletType] = useState<string>("");
  const [isWalletVerified, setIsWalletVerified] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'auth' | 'dashboard' | 'games' | 'admin'>('home');
  const [overBalance, setOverBalance] = useState(0);
  const navigate = useNavigate();

  // Initialize chip manager and player stats
  const chipManager = useChipManager();
  const playerStats = usePlayerStats(walletAddress);

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Check user profile for wallet info
        const { data: profile } = await supabase
          .from('profiles')
          .select('verified_wallet_address')
          .eq('user_id', session.user.id)
          .single();
          
        if (profile?.verified_wallet_address) {
          setWalletAddress(profile.verified_wallet_address);
          setIsWalletConnected(true);
          setIsWalletVerified(true);
          setWalletType('Verified');
          setCurrentView('dashboard');
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Check for wallet connection after auth
          setTimeout(async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('verified_wallet_address')
              .eq('user_id', session.user.id)
              .single();
              
            if (profile?.verified_wallet_address) {
              setWalletAddress(profile.verified_wallet_address);
              setIsWalletConnected(true);
              setIsWalletVerified(true);
              setWalletType('Verified');
              setCurrentView('dashboard');
            }
          }, 0);
        } else {
          setUser(null);
          handleAuthDisconnect();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Authentication functions
  const handleAuthSuccess = () => {
    // User will be set via onAuthStateChange
    // If they already have a wallet connected, it will be loaded
    // Otherwise, show wallet connection
    setCurrentView('dashboard');
  };

  const handleAuthDisconnect = () => {
    setUser(null);
    setIsWalletConnected(false);
    setWalletAddress("");
    setWalletType("");
    setIsWalletVerified(false);
    setCurrentView('home');
    localStorage.removeItem('wallet_connection');
    localStorage.removeItem('current_view');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      handleAuthDisconnect();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error("Failed to sign out");
    }
  };

  // Admin check via secure backend
  const { data: adminStatus } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: () => secureAdminService.checkAdminStatus(),
    enabled: !!user?.id
  });
  const isAdmin = adminStatus?.isAdmin || false;

  // Load player balance from database
  useEffect(() => {
    if (!walletAddress) return;
    
    const loadPlayerBalance = async () => {
      try {
        const { securePlayerService } = await import('@/services/secure-player');
        const balance = await securePlayerService.getPlayerBalance();
        if (balance) {
          setOverBalance(balance.overTokens);
        }
      } catch (error) {
        console.error('Failed to load player balance:', error);
      }
    };

    loadPlayerBalance();
  }, [walletAddress]);

  // Load wallet state from localStorage on component mount (backup only)
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet_connection');
    const savedView = localStorage.getItem('current_view');
    
    if (savedWallet) {
      const walletData = JSON.parse(savedWallet);
      setIsWalletConnected(walletData.isConnected);
      setWalletAddress(walletData.address);
      setWalletType(walletData.type);
      setIsWalletVerified(walletData.verified || false);
    }
    
    if (savedView && savedWallet) {
      setCurrentView(savedView as 'home' | 'dashboard' | 'games' | 'admin');
    }
  }, []);

  // Save wallet state to localStorage whenever it changes (backup)
  useEffect(() => {
    if (isWalletConnected) {
      localStorage.setItem('wallet_connection', JSON.stringify({
        isConnected: isWalletConnected,
        address: walletAddress,
        type: walletType,
        verified: isWalletVerified
      }));
      localStorage.setItem('current_view', currentView);
    }
  }, [isWalletConnected, walletAddress, walletType, isWalletVerified, currentView]);

  const handleWalletConnect = (connectedWalletType: string, address: string, verified: boolean) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
    setWalletType(connectedWalletType);
    setIsWalletVerified(verified);
    
    // Set initial view to dashboard, admin check will happen via query
    setCurrentView('dashboard');
    
    toast.success("Wallet connected successfully!", {
      description: `Connected with ${connectedWalletType}`
    });
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    setWalletType("");
    setIsWalletVerified(false);
    setCurrentView('home');
    localStorage.removeItem('wallet_connection');
    localStorage.removeItem('current_view');
  };

  const handleChipPurchase = (chips: number) => {
    chipManager.setPlayerChips(prev => prev + chips);
    toast.success(`Added ${chips} chips to your account!`);
  };

  const handleOverPurchaseChips = (chipAmount: number, overCost: number) => {
    if (overBalance >= overCost) {
      setOverBalance(prev => prev - overCost);
      chipManager.setPlayerChips(prev => prev + chipAmount);
    }
  };

  const handleOverWithdraw = (amount: number) => {
    setOverBalance(prev => prev - amount);
    // In real implementation, this would trigger blockchain transaction
  };

  const handlePlayGame = (gameId: string) => {
    if (!chipManager.canPlayGame(gameId)) {
      toast.error("Not enough chips to play!");
      return;
    }
    
    if (chipManager.consumeChip(gameId)) {
      toast.success("Chip consumed! Enjoy your game!");
      // Track game play in player stats
      playerStats.setPlayerStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        lastPlayed: new Date().toISOString()
      }));
      navigate(`/game/${gameId}`);
    }
  };

  const renderCurrentView = () => {
    // Show auth page if user is not logged in
    if (!user && currentView === 'auth') {
      return (
        <AuthPage 
          onSuccess={handleAuthSuccess}
          onBack={() => setCurrentView('home')}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <PlayerDashboard playerAddress={walletAddress} playerChips={chipManager.playerChips} />
            <Card className="p-6 bg-gradient-card border-primary animate-glow">
              <h3 className="text-xl font-bold text-primary mb-4">Player Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-neon-green">{playerStats.playerStats.totalScore.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-neon-blue">{playerStats.playerStats.gamesPlayed}</p>
                  <p className="text-sm text-muted-foreground">Games Played</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-arcade-gold">{overBalance.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">OVER Balance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-neon-purple">{playerStats.playerStats.achievements.length}</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/20 p-4 rounded-lg border border-neon-cyan/30">
                  <h4 className="font-semibold text-neon-cyan mb-2">Tetris High Score</h4>
                  <p className="text-xl font-bold">{playerStats.playerStats.highScores.tetris.toLocaleString()}</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg border border-neon-green/30">
                  <h4 className="font-semibold text-neon-green mb-2">Snake High Score</h4>
                  <p className="text-xl font-bold">{playerStats.playerStats.highScores.snake.toLocaleString()}</p>
                </div>
                <div className="bg-muted/20 p-4 rounded-lg border border-neon-yellow/30">
                  <h4 className="font-semibold text-neon-yellow mb-2">Pac-Man High Score</h4>
                  <p className="text-xl font-bold">{playerStats.playerStats.highScores.pacman.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'games':
        return <GameGrid playerChips={chipManager.playerChips} onPlayGame={handlePlayGame} />;
      case 'admin':
        return <AdminPanel walletAddress={walletAddress} isVisible={isAdmin} />;
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
              <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl animate-gradient" style={{
                background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)',
                backgroundSize: '400% 400%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
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

            {/* Authentication Section */}
            {!user ? (
              <div className="mt-12 backdrop-glass rounded-2xl p-6 md:p-8 border border-neon shadow-glow animate-pulse-border hover-lift">
                <h3 className="text-xl font-bold text-center text-foreground mb-4">
                  Get Started
                </h3>
                <p className="text-muted-foreground text-center mb-6">
                  Sign up or sign in to connect your wallet and start playing!
                </p>
                <div className="flex justify-center">
                  <Button 
                    variant="neon"
                    size="lg"
                    onClick={() => setCurrentView('auth')}
                    className="min-w-48"
                  >
                    Sign In / Register
                  </Button>
                </div>
              </div>
            ) : !isWalletConnected ? (
              <div className="mt-12 backdrop-glass rounded-2xl p-6 md:p-8 border border-neon shadow-glow animate-pulse-border hover-lift">
                <WalletConnection 
                  onConnect={handleWalletConnect} 
                  onDisconnect={handleWalletDisconnect}
                  isConnected={isWalletConnected}
                  walletType={walletType}
                  walletAddress={walletAddress}
                  isVerified={isWalletVerified}
                />
              </div>
            ) : null}
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
                  {isAdmin && (
                    <Button
                      variant={currentView === 'admin' ? 'destructive' : 'outline'}
                      onClick={() => setCurrentView('admin')}
                      className="font-bold hover:shadow-glow transition-all duration-300 text-sm md:text-base px-3 md:px-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-4">
                  <ChipDisplay 
                    playerChips={chipManager.playerChips} 
                    timeUntilReset={chipManager.getTimeUntilReset()}
                    currentLives={playerStats.playerStats.overTokens > 0 ? 3 : 0}
                    showLives={isWalletConnected}
                  />
                  <Badge variant="secondary" className="bg-arcade-gold/20 text-arcade-gold border-arcade-gold">
                    Score: {playerStats.playerStats.totalScore.toLocaleString()}
                  </Badge>
                  <OverProtocolIntegration
                    walletAddress={walletAddress}
                    overBalance={overBalance}
                    onPurchaseChips={handleOverPurchaseChips}
                    onWithdrawTokens={handleOverWithdraw}
                  />
                  <WalletConnection 
                    onConnect={handleWalletConnect} 
                    onDisconnect={handleWalletDisconnect}
                    isConnected={isWalletConnected}
                    walletType={walletType}
                    walletAddress={walletAddress}
                    isVerified={isWalletVerified}
                  />
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="h-8 px-3 text-xs hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Sign Out
                    </Button>
                  )}
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
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
