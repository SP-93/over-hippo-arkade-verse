import hippoCharacter from '@/assets/hippo-character.png';

export const FuturisticHippo = () => {
  return (
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
      
      {/* Original Hippo Character Image */}
      <div className="relative z-10 flex items-center justify-center">
        <img 
          src={hippoCharacter} 
          alt="Hippo Character" 
          className="w-48 h-48 object-contain"
          style={{ filter: 'drop-shadow(0 0 20px rgba(139, 69, 19, 0.5))' }}
        />
      </div>
    </div>
  );
};