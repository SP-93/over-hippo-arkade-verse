
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HippoBackground } from "@/components/HippoBackground";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { AuthPage } from "@/components/AuthPage";
import { WalletConnection } from "@/components/WalletConnection";
import { Navigation, NavigationTab } from "@/components/Navigation";
import { Home } from "@/components/Home";
import { Dashboard } from "@/components/Dashboard";
import { Games } from "@/components/Games";
import { useGlobalBalance } from "@/contexts/GlobalBalanceContext";
import { walletPersistence } from "@/utils/walletPersistence";
import { toast } from "sonner";

const Index = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { refreshBalance } = useGlobalBalance();
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [showAuth, setShowAuth] = useState(false);
  
  // Wallet connection state
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletType, setWalletType] = useState<string>("");

  // Check for persisted wallet on load
  useEffect(() => {
    const persistedWallet = walletPersistence.loadWalletData();
    if (persistedWallet && persistedWallet.isConnected) {
      setIsWalletConnected(true);
      setWalletAddress(persistedWallet.address);
      setWalletType(persistedWallet.type);
    }
  }, []);



  // Wallet connection handlers
  const handleWalletConnect = (walletType: string, address: string, verified: boolean) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
    setWalletType(walletType);
    walletPersistence.saveWalletData({ isConnected: true, address, type: walletType, verified });
    toast.success(`${walletType} wallet connected successfully!`);
    refreshBalance();
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    setWalletType("");
    walletPersistence.clearWalletData();
    toast.info("Wallet disconnected");
  };

  const handleAuthSuccess = () => {
    toast.success("Welcome to Over Hippo Arkade!");
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading Over Hippo Arkade...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen first, then auth
  if (!user) {
    if (!showAuth) {
      // Welcome screen
      return (
        <div className="min-h-screen bg-background relative overflow-hidden">
          <HippoBackground />
          <ParticleCanvas width={800} height={600} />
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
            {/* Main Title */}
            <div className="text-center mb-16 animate-fade-in">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 text-white font-orbitron tracking-wider animate-neon-pulse">
                OVER HIPPO ARKADE
              </h1>
              <p className="text-xl md:text-2xl text-primary-glow mb-8 max-w-3xl mx-auto font-exo2">
                The ultimate Web3 gaming platform where retro meets blockchain
              </p>
            </div>

            {/* Central Hippo Character with Neon Circle */}
            <div className="relative mb-16 animate-float">
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto">
                {/* Neon Circle Effect */}
                <div className="absolute inset-0 rounded-full border-4 border-primary animate-neon-pulse opacity-80"></div>
                <div className="absolute inset-2 rounded-full border-2 border-secondary animate-pulse opacity-60"></div>
                
                {/* Hippo Character */}
                <img
                  src="/src/assets/hippo-character.png"
                  alt="Hippo Character"
                  className="w-full h-full object-contain relative z-10 drop-shadow-lg"
                  style={{
                    filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.6))',
                  }}
                />
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-6 animate-zoom-in">
              <button
                onClick={() => setShowAuth(true)}
                className="px-12 py-4 bg-gradient-primary text-primary-foreground text-xl font-bold rounded-lg hover:shadow-neon transform hover:scale-105 transition-all duration-300 font-orbitron tracking-wide"
              >
                START PLAYING
              </button>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto font-exo2">
                Play classic arcade games • Earn OVER tokens • Join the future of gaming
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center group-hover:animate-neon-pulse">
                  <span className="text-2xl">🎮</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-2 font-orbitron">Play & Earn</h3>
                <p className="text-sm text-muted-foreground font-exo2">Classic arcade games with crypto rewards</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-secondary rounded-full flex items-center justify-center group-hover:animate-neon-pulse">
                  <span className="text-2xl">⛓️</span>
                </div>
                <h3 className="text-lg font-bold text-secondary mb-2 font-orbitron">Web3 Gaming</h3>
                <p className="text-sm text-muted-foreground font-exo2">Blockchain-powered gaming platform</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-neon rounded-full flex items-center justify-center group-hover:animate-neon-pulse">
                  <span className="text-2xl">👾</span>
                </div>
                <h3 className="text-lg font-bold text-accent mb-2 font-orbitron">Retro Style</h3>
                <p className="text-sm text-muted-foreground font-exo2">Nostalgic gaming with modern tech</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Auth page
      return (
        <div className="min-h-screen bg-background relative overflow-hidden">
          <HippoBackground />
          <ParticleCanvas width={800} height={600} />
          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <AuthPage 
              onSuccess={handleAuthSuccess}
              onBack={() => setShowAuth(false)} 
            />
          </div>
        </div>
      );
    }
  }

  // Show wallet connection if user is logged in but wallet not connected
  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <HippoBackground />
        <ParticleCanvas width={800} height={600} />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-black mb-4 bg-gradient-primary bg-clip-text text-transparent">
              OVER HIPPO ARKADE
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connect your wallet to start playing and earning OVER tokens!
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <WalletConnection
              isConnected={isWalletConnected}
              walletType={walletType}
              walletAddress={walletAddress}
              isVerified={true}
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main application with navigation
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'dashboard':
        return <Dashboard />;
      case 'games':
        return <Games />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <HippoBackground />
      <ParticleCanvas width={800} height={600} />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Navigation */}
        <Navigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
