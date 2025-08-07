import React from 'react';
import { HeroHippo } from '@/components/HeroHippo';

export const Home: React.FC = () => {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Spectacular Hippo with original image */}
          <div className="relative flex justify-center animate-scale-in">
            <HeroHippo />
          </div>

        {/* Title below hippo */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-wider animate-neon-pulse animate-fade-in"
              style={{ 
                textShadow: '0 0 20px #ec4899, 0 0 40px #ec4899, 0 0 60px #ec4899',
                filter: 'drop-shadow(0 0 10px #a855f7)'
              }}>
            OVER HIPPO ARKADE
          </h1>
          <p className="text-lg md:text-xl text-cyan-300 animate-fade-in"
             style={{ textShadow: '0 0 10px #22d3ee' }}>
            The ultimate Web3 gaming platform
          </p>
        </div>

        {/* Feature Text */}
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2 group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center group-hover:animate-pulse"
                   style={{ filter: 'drop-shadow(0 0 15px #ec4899)' }}>
                <span className="text-2xl">🎮</span>
              </div>
              <div className="text-lg font-bold text-pink-300"
                   style={{ textShadow: '0 0 8px #f472b6' }}>Play & Earn</div>
              <p className="text-sm text-cyan-200">Earn OVER tokens while playing classic arcade games</p>
            </div>
            <div className="space-y-2 group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:animate-pulse"
                   style={{ filter: 'drop-shadow(0 0 15px #a855f7)' }}>
                <span className="text-2xl">⛓️</span>
              </div>
              <div className="text-lg font-bold text-purple-300"
                   style={{ textShadow: '0 0 8px #c084fc' }}>Web3 Gaming</div>
              <p className="text-sm text-cyan-200">Blockchain-powered gaming with true ownership</p>
            </div>
            <div className="space-y-2 group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full flex items-center justify-center group-hover:animate-pulse"
                   style={{ filter: 'drop-shadow(0 0 15px #22d3ee)' }}>
                <span className="text-2xl">👾</span>
              </div>
              <div className="text-lg font-bold text-cyan-300"
                   style={{ textShadow: '0 0 8px #22d3ee' }}>Retro Style</div>
              <p className="text-sm text-cyan-200">Classic arcade games with modern Web3 features</p>
            </div>
          </div>
        </div>

        {/* Enhanced Gradient Overlay Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>
    </div>
  );
};