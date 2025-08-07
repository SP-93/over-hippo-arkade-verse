import React from "react";
import hippoCharacter from "@/assets/hippo-character.png";

export const HeroHippo: React.FC = () => {
  return (
    <div className="relative w-64 h-64 md:w-72 md:h-72 animate-float">
      {/* Pink Neon Circle (halo) */}
      <div
        className="absolute inset-0 rounded-full border-4 border-pink-500"
        style={{
          filter: "drop-shadow(0 0 20px #ec4899)",
          boxShadow: "inset 0 0 20px rgba(236, 72, 153, 0.3)",
        }}
      />

      {/* Golden Coin Stacks around hippo */}
      <div
        className="absolute top-8 left-8 w-8 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform rotate-12"
        style={{ filter: "drop-shadow(0 0 10px gold)" }}
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-4 h-2 bg-yellow-300 rounded-full" />
      </div>

      <div
        className="absolute top-12 right-8 w-8 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform -rotate-12"
        style={{ filter: "drop-shadow(0 0 10px gold)" }}
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-4 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-6 h-2 bg-yellow-300 rounded-full" />
      </div>

      <div
        className="absolute bottom-8 left-12 w-8 h-14 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform rotate-6"
        style={{ filter: "drop-shadow(0 0 10px gold)" }}
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-4 h-2 bg-yellow-300 rounded-full" />
      </div>

      <div
        className="absolute bottom-12 right-12 w-8 h-10 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg transform -rotate-6"
        style={{ filter: "drop-shadow(0 0 10px gold)" }}
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-yellow-300 rounded-full" />
        <div className="absolute inset-x-0 top-2 h-2 bg-yellow-300 rounded-full" />
      </div>

      {/* Hippo image */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <img
          src={hippoCharacter}
          alt="Over Hippo Arkade mascot"
          className="w-56 h-56 md:w-64 md:h-64 object-contain"
          style={{
            filter:
              "drop-shadow(0 0 25px rgba(236,72,153,0.6)) drop-shadow(0 0 40px rgba(59,130,246,0.35))",
          }}
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default HeroHippo;
