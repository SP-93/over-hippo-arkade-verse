export const FuturisticHippo = () => {
  return (
    <div className="relative w-80 h-80 mx-auto">
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
        <div className="w-56 h-56 rounded-full border-4 border-pink-500"
             style={{ 
               filter: 'drop-shadow(0 0 20px #ec4899)',
               boxShadow: 'inset 0 0 20px rgba(236, 72, 153, 0.3)'
             }} />
      </div>

      {/* Central Hippo Character */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative w-32 h-32">
          {/* Hippo Body */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
            
            {/* Black Gaming Headphones */}
            <div className="absolute -top-3 left-3 right-3">
              <div className="bg-black rounded-full h-6 relative">
                {/* Left Speaker */}
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded-full">
                  <div className="absolute inset-1 bg-gray-800 rounded-full" />
                </div>
                
                {/* Right Speaker */}
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded-full">
                  <div className="absolute inset-1 bg-gray-800 rounded-full" />
                </div>
              </div>
            </div>

            {/* Eyes */}
            <div className="absolute top-6 left-6 w-4 h-4 bg-cyan-400 rounded-full" />
            <div className="absolute top-6 right-6 w-4 h-4 bg-cyan-400 rounded-full" />

            {/* Nose */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-pink-400 rounded-full" />

            {/* Mouth */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-6 h-3 border-b-2 border-cyan-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};