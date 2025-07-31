import futuristicHippo from "@/assets/futuristic-hippo.png";

export const FuturisticHippo = () => {
  return (
    <div className="relative w-96 h-96 mx-auto animate-float">
      {/* Multiple Golden Coin Stacks */}
      <div className="absolute top-4 left-4 w-10 h-16 transform rotate-12">
        <div className="absolute bottom-0 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500"
             style={{ 
               filter: 'drop-shadow(0 0 20px #ffd700)',
               boxShadow: '0 0 30px rgba(255, 215, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
             }} />
        <div className="absolute bottom-3 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-95" />
        <div className="absolute bottom-6 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-9 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-85" />
        <div className="absolute bottom-12 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-80" />
      </div>

      <div className="absolute top-8 right-2 w-10 h-14 transform -rotate-15">
        <div className="absolute bottom-0 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500"
             style={{ filter: 'drop-shadow(0 0 20px #ffd700)' }} />
        <div className="absolute bottom-3 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-95" />
        <div className="absolute bottom-6 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-9 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-85" />
      </div>

      <div className="absolute bottom-8 left-2 w-10 h-14 transform rotate-20">
        <div className="absolute bottom-0 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500"
             style={{ filter: 'drop-shadow(0 0 20px #ffd700)' }} />
        <div className="absolute bottom-3 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-95" />
        <div className="absolute bottom-6 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-9 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-85" />
      </div>

      <div className="absolute bottom-4 right-4 w-10 h-16 transform -rotate-18">
        <div className="absolute bottom-0 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500"
             style={{ filter: 'drop-shadow(0 0 20px #ffd700)' }} />
        <div className="absolute bottom-3 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-95" />
        <div className="absolute bottom-6 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-9 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-85" />
        <div className="absolute bottom-12 w-10 h-4 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 rounded-full border border-yellow-500 opacity-80" />
      </div>

      {/* Intense Pink Neon Halo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-80 h-80 rounded-full"
             style={{ 
               background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(244, 114, 182, 0.2) 30%, transparent 70%)',
               filter: 'drop-shadow(0 0 40px #ec4899) drop-shadow(0 0 80px #f472b6) drop-shadow(0 0 120px #ec4899)',
               boxShadow: '0 0 60px rgba(236, 72, 153, 0.6), 0 0 120px rgba(244, 114, 182, 0.4), inset 0 0 40px rgba(236, 72, 153, 0.2)'
             }} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-72 h-72 rounded-full border-4 border-pink-400"
             style={{ 
               filter: 'drop-shadow(0 0 30px #ec4899) drop-shadow(0 0 60px #f472b6)',
               boxShadow: '0 0 50px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(244, 114, 182, 0.3)'
             }} />
      </div>

      {/* Futuristic Hippo Character */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative">
          <img 
            src={futuristicHippo} 
            alt="Futuristic Hippo Character" 
            className="w-56 h-56 object-contain"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(138, 43, 226, 0.5)) brightness(1.1) contrast(1.1)',
            }}
          />
          {/* Extra glow around the hippo */}
          <div className="absolute inset-0 w-56 h-56 rounded-full"
               style={{
                 background: 'radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 60%)',
                 filter: 'blur(20px)'
               }} />
        </div>
      </div>

      {/* Cyberpunk Atmosphere Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full rounded-full"
             style={{
               background: 'conic-gradient(from 0deg, rgba(236, 72, 153, 0.1), rgba(138, 43, 226, 0.1), rgba(244, 114, 182, 0.1), rgba(236, 72, 153, 0.1))',
               animation: 'spin 20s linear infinite'
             }} />
      </div>
    </div>
  );
};