import futuristicHippo from "@/assets/futuristic-hippo.png";

export const FuturisticHippo = () => {
  return (
    <div className="relative w-96 h-96 mx-auto animate-float">
      {/* Simple Golden Coin Stacks */}
      <div className="absolute top-4 left-4 w-8 h-12 transform rotate-12">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500" />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-80" />
      </div>

      <div className="absolute top-8 right-4 w-8 h-12 transform -rotate-15">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500" />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-80" />
      </div>

      <div className="absolute bottom-8 left-4 w-8 h-12 transform rotate-20">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500" />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-80" />
      </div>

      <div className="absolute bottom-4 right-4 w-8 h-12 transform -rotate-18">
        <div className="absolute bottom-0 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500" />
        <div className="absolute bottom-2 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-90" />
        <div className="absolute bottom-4 w-8 h-3 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border border-yellow-500 opacity-80" />
      </div>

      {/* Simple Pink Circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-72 h-72 rounded-full border-2 border-pink-400" />
      </div>

      {/* Futuristic Hippo Character */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <img 
          src={futuristicHippo} 
          alt="Futuristic Hippo Character" 
          className="w-64 h-64 object-contain"
        />
      </div>
    </div>
  );
};