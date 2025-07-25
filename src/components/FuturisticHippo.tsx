import { useEffect, useState } from 'react';

export const FuturisticHippo = () => {
  const [coins, setCoins] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);

  useEffect(() => {
    // Generate floating coins
    const newCoins = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      y: Math.random() * 400,
      rotation: Math.random() * 360,
    }));
    setCoins(newCoins);
  }, []);

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Floating Golden Coins */}
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute w-8 h-8 animate-float opacity-80"
          style={{
            left: `${coin.x / 5}%`,
            top: `${coin.y / 5}%`,
            animationDelay: `${coin.id * 0.5}s`,
            animationDuration: '3s',
          }}
        >
          <div
            className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg animate-spin"
            style={{
              animationDuration: '4s',
              filter: 'drop-shadow(0 0 10px gold)',
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-yellow-900">
              $
            </span>
          </div>
        </div>
      ))}

      {/* Multiple Neon Circle Effects */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer pulsing circle */}
        <div className="absolute w-80 h-80 rounded-full border-4 border-pink-500 animate-pulse opacity-40" 
             style={{ filter: 'drop-shadow(0 0 30px #ec4899)' }} />
        
        {/* Middle rotating circle */}
        <div className="absolute w-64 h-64 rounded-full border-2 border-purple-400 animate-spin opacity-60"
             style={{ 
               animationDuration: '8s',
               filter: 'drop-shadow(0 0 20px #c084fc)'
             }} />
        
        {/* Inner pulsing circle */}
        <div className="absolute w-48 h-48 rounded-full border-4 border-cyan-400 animate-pulse opacity-80"
             style={{ 
               animationDelay: '1s',
               filter: 'drop-shadow(0 0 25px #22d3ee)'
             }} />
      </div>

      {/* Central Hippo Character */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative w-40 h-40">
          {/* Hippo Body */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full shadow-2xl"
               style={{ filter: 'drop-shadow(0 0 30px #a855f7)' }}>
            
            {/* Gaming Headphones */}
            <div className="absolute -top-4 left-4 right-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-full h-8 relative"
                   style={{ filter: 'drop-shadow(0 0 15px #ec4899)' }}>
                {/* Left Speaker */}
                <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-pink-500">
                  <div className="absolute inset-2 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full animate-pulse"
                       style={{ filter: 'drop-shadow(0 0 10px #ec4899)' }} />
                </div>
                
                {/* Right Speaker */}
                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full border-2 border-pink-500">
                  <div className="absolute inset-2 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full animate-pulse"
                       style={{ 
                         filter: 'drop-shadow(0 0 10px #ec4899)',
                         animationDelay: '0.5s'
                       }} />
                </div>
              </div>
            </div>

            {/* Eyes with Neon Glow */}
            <div className="absolute top-8 left-8 w-6 h-6 bg-cyan-400 rounded-full animate-pulse"
                 style={{ filter: 'drop-shadow(0 0 15px #22d3ee)' }} />
            <div className="absolute top-8 right-8 w-6 h-6 bg-cyan-400 rounded-full animate-pulse"
                 style={{ 
                   filter: 'drop-shadow(0 0 15px #22d3ee)',
                   animationDelay: '0.3s'
                 }} />

            {/* Nose */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-pink-400 rounded-full"
                 style={{ filter: 'drop-shadow(0 0 8px #f472b6)' }} />

            {/* Mouth with Smile */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-8 h-4 border-b-4 border-cyan-400 rounded-full"
                 style={{ filter: 'drop-shadow(0 0 10px #22d3ee)' }} />

            {/* Metallic Chrome Highlights */}
            <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-br from-white to-gray-300 rounded-full opacity-30 blur-sm" />
            <div className="absolute bottom-6 right-6 w-6 h-6 bg-gradient-to-br from-white to-gray-300 rounded-full opacity-20 blur-sm" />
          </div>

          {/* Sparkle Effects */}
          <div className="absolute -top-2 -left-2 w-4 h-4 text-yellow-400 animate-ping">✨</div>
          <div className="absolute -top-4 -right-4 w-4 h-4 text-pink-400 animate-ping" style={{ animationDelay: '1s' }}>✨</div>
          <div className="absolute -bottom-2 -left-4 w-4 h-4 text-purple-400 animate-ping" style={{ animationDelay: '2s' }}>✨</div>
          <div className="absolute -bottom-4 -right-2 w-4 h-4 text-cyan-400 animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
        </div>
      </div>
    </div>
  );
};