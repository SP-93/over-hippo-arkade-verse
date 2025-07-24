import React from 'react';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { HippoBackground } from '@/components/HippoBackground';

export const Home: React.FC = () => {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      {/* Particle Animation Background */}
      <div className="absolute inset-0 z-0">
        <ParticleCanvas width={800} height={600} />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
            OVER HIPPO ARKADE
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in">
            The ultimate Web3 gaming platform
          </p>
        </div>

        {/* Hippo Character with Neon Circle */}
        <div className="relative flex justify-center animate-scale-in">
          <div className="relative">
            {/* Neon Circle Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 blur-xl animate-pulse"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-lg"></div>
            
            {/* Hippo Character */}
            <div className="relative z-10">
              <HippoBackground />
            </div>
          </div>
        </div>

        {/* Feature Text */}
        <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">Play & Earn</div>
              <p className="text-muted-foreground">Earn OVER tokens while playing classic arcade games</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-secondary">Web3 Gaming</div>
              <p className="text-muted-foreground">Blockchain-powered gaming with true ownership</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-accent">Retro Style</div>
              <p className="text-muted-foreground">Classic arcade games with modern Web3 features</p>
            </div>
          </div>
        </div>

        {/* Gradient Overlay Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>
    </div>
  );
};