
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
      // Welcome screen - exact match to image
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center relative">
          {/* Content */}
          <div className="relative z-10 text-center space-y-12 px-4">
            {/* Hippo with original image - centered */}
            <div className="relative flex justify-center">
              <div className="relative animate-float">
                {/* Golden Coin Stacks around hippo */}
                <div className="absolute top-8 left-8 w-8 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform rotate-12"
                     style={{ filter: 'drop-shadow(0 0 10px gold)' }}>
                  <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-4 h-2 bg-yellow-300 rounded-full"></div>
                </div>

                <div className="absolute top-12 right-8 w-8 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform -rotate-12"
                     style={{ filter: 'drop-shadow(0 0 10px gold)' }}>
                  <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-4 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-6 h-2 bg-yellow-300 rounded-full"></div>
                </div>

                <div className="absolute bottom-8 left-12 w-8 h-14 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform rotate-6"
                     style={{ filter: 'drop-shadow(0 0 10px gold)' }}>
                  <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-4 h-2 bg-yellow-300 rounded-full"></div>
                </div>

                <div className="absolute bottom-12 right-12 w-8 h-10 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform -rotate-6"
                     style={{ filter: 'drop-shadow(0 0 10px gold)' }}>
                  <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full"></div>
                  <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full"></div>
                </div>

                {/* Pink Neon Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full border-4 border-pink-500"
                       style={{ 
                         filter: 'drop-shadow(0 0 20px #ec4899)',
                         boxShadow: 'inset 0 0 20px rgba(236, 72, 153, 0.3)'
                       }} />
                </div>
                
                {/* Futuristic Hippo Component */}
                <div className="relative z-10 flex items-center justify-center">
                  <FuturisticHippo />
                </div>
              </div>
            </div>

            {/* Title BELOW hippo - as shown in image */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-white"
                  style={{ 
                    filter: 'drop-shadow(0 0 20px #ec4899)',
                    textShadow: '0 0 30px #ec4899, 0 0 60px #ec4899'
                  }}>
                OVER HIPPO ARKADE
              </h1>
              <p className="text-xl md:text-2xl text-cyan-400 font-bold">
                The ultimate Web3 gaming platform
              </p>
            </div>

            {/* Call to Action */}
            <div className="space-y-6">
              <button
                onClick={() => setShowAuth(true)}
                className="text-xl px-8 py-4 font-black bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white border-0 transform hover:scale-105 transition-all duration-300 rounded-lg"
                style={{ 
                  boxShadow: '0 0 30px rgba(236, 72, 153, 0.6)',
                  filter: 'drop-shadow(0 0 10px #ec4899)'
                }}
              >
                START PLAYING
              </button>
              <p className="text-cyan-300 text-lg font-medium">
                Play retro games and earn WOVER tokens!
              </p>
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
