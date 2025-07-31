import hippoCharacter from "@/assets/hippo-character.png";

export const FuturisticHippo = () => {
  return (
    <div className="relative w-80 h-80 mx-auto animate-float">
      {/* Simple Golden Coin Stacks */}
      <div className="absolute top-8 left-8 w-8 h-12 transform rotate-12">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full"
             style={{ 
               filter: 'drop-shadow(0 0 15px #ffd700)',
               boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)'
             }} />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-80" />
        <div className="absolute bottom-6 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-70" />
      </div>

      <div className="absolute top-12 right-6 w-8 h-10 transform -rotate-8">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full"
             style={{ filter: 'drop-shadow(0 0 15px #ffd700)' }} />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-80" />
      </div>

      <div className="absolute bottom-12 left-6 w-8 h-10 transform rotate-15">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full"
             style={{ filter: 'drop-shadow(0 0 15px #ffd700)' }} />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-80" />
      </div>

      <div className="absolute bottom-8 right-8 w-8 h-10 transform -rotate-12">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full"
             style={{ filter: 'drop-shadow(0 0 15px #ffd700)' }} />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full opacity-80" />
      </div>

      {/* Pink Neon Circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full border-4 border-pink-500"
             style={{ 
               filter: 'drop-shadow(0 0 30px #ec4899) drop-shadow(0 0 60px #f472b6)',
               boxShadow: '0 0 50px rgba(236, 72, 153, 0.4)'
             }} />
      </div>

      {/* Hippo Character Image */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <img 
          src={hippoCharacter} 
          alt="Hippo Character" 
          className="w-48 h-48 object-contain"
        />
      </div>
    </div>
  );
};