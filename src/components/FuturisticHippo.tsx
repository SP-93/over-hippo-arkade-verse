import hippoCharacter from '/lovable-uploads/63209d94-f496-4657-a0c3-09577a7a27a1.png';

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

      {/* Enhanced Pink Neon Halo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-72 h-72 rounded-full border-8 border-pink-500"
             style={{ 
               filter: 'drop-shadow(0 0 30px #ec4899) drop-shadow(0 0 60px #ec4899)',
               boxShadow: 'inset 0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(236, 72, 153, 0.3)'
             }} />
      </div>
      
      {/* Futuristic Hippo Character */}
      <div className="relative z-10 flex items-center justify-center">
        <img 
          src={hippoCharacter} 
          alt="Futuristic Hippo Character" 
          className="w-56 h-56 object-contain"
          style={{ filter: 'drop-shadow(0 0 25px rgba(147, 51, 234, 0.6)) drop-shadow(0 0 50px rgba(59, 130, 246, 0.4))' }}
        />
      </div>
    </div>
  );
};