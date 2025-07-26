
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HippoBackground } from "@/components/HippoBackground";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { FuturisticHippo } from "@/components/FuturisticHippo";
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
        <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
          <ParticleCanvas width={800} height={600} />
          
          {/* Dark cyberpunk background effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent" />
          
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
            {/* Main Title */}
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-white tracking-wider animate-neon-pulse"
                  style={{ 
                    textShadow: '0 0 20px #ec4899, 0 0 40px #ec4899, 0 0 60px #ec4899',
                    filter: 'drop-shadow(0 0 10px #a855f7)'
                  }}>
                OVER HIPPO ARKADE
              </h1>
              <p className="text-lg md:text-xl text-cyan-300 mb-8 max-w-3xl mx-auto"
                 style={{ textShadow: '0 0 10px #22d3ee' }}>
                The ultimate Web3 gaming platform where retro meets blockchain
              </p>
            </div>

            {/* Spectacular Futuristic Hippo */}
            <div className="relative mb-12 animate-float">
              <FuturisticHippo />
            </div>

            {/* Call to Action */}
            <div className="text-center space-y-6 animate-zoom-in">
              <button
                onClick={() => setShowAuth(true)}
                className="px-12 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white text-xl font-bold rounded-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 tracking-wide relative overflow-hidden group"
                style={{ 
                  filter: 'drop-shadow(0 0 20px #ec4899)',
                  boxShadow: '0 0 30px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                }}
              >
                <span className="relative z-10">START PLAYING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
              <p className="text-sm text-cyan-200 max-w-lg mx-auto"
                 style={{ textShadow: '0 0 5px #22d3ee' }}>
                Play classic arcade games • Earn OVER tokens • Join the future of gaming
              </p>
            </div>

            {/* Enhanced Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
              <div className="text-center group relative">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center group-hover:animate-pulse relative overflow-hidden"
                     style={{ filter: 'drop-shadow(0 0 15px #ec4899)' }}>
                  <span className="text-3xl relative z-10">🎮</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform rotate-45 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
                </div>
                <h3 className="text-lg font-bold text-pink-300 mb-2"
                    style={{ textShadow: '0 0 8px #f472b6' }}>Play & Earn</h3>
                <p className="text-sm text-cyan-200">Classic arcade games with crypto rewards</p>
              </div>
              <div className="text-center group relative">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:animate-pulse relative overflow-hidden"
                     style={{ filter: 'drop-shadow(0 0 15px #a855f7)' }}>
                  <span className="text-3xl relative z-10">⛓️</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform rotate-45 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
                </div>
                <h3 className="text-lg font-bold text-purple-300 mb-2"
                    style={{ textShadow: '0 0 8px #c084fc' }}>Web3 Gaming</h3>
                <p className="text-sm text-cyan-200">Blockchain-powered gaming platform</p>
              </div>
              <div className="text-center group relative">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full flex items-center justify-center group-hover:animate-pulse relative overflow-hidden"
                     style={{ filter: 'drop-shadow(0 0 15px #22d3ee)' }}>
                  <span className="text-3xl relative z-10">👾</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform rotate-45 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
                </div>
                <h3 className="text-lg font-bold text-cyan-300 mb-2"
                    style={{ textShadow: '0 0 8px #22d3ee' }}>Retro Style</h3>
                <p className="text-sm text-cyan-200">Nostalgic gaming with modern tech</p>
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
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
        <ParticleCanvas width={800} height={600} />
        
        {/* Dark cyberpunk background effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent" />
        
        <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black mb-6 text-white tracking-wider animate-neon-pulse"
                style={{ 
                  textShadow: '0 0 20px #ec4899, 0 0 40px #ec4899, 0 0 60px #ec4899',
                  filter: 'drop-shadow(0 0 10px #a855f7)'
                }}>
              OVER HIPPO ARKADE
            </h1>
            <p className="text-lg md:text-xl text-cyan-300 mb-8"
               style={{ textShadow: '0 0 10px #22d3ee' }}>
              Connect your wallet to start playing and earning OVER tokens!
            </p>
          </div>

          {/* Spectacular Futuristic Hippo */}
          <div className="relative mb-12 animate-float">
            <FuturisticHippo />
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
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <ParticleCanvas width={800} height={600} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent" />
      
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
