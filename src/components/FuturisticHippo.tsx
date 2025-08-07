import hippoCharacter from '@/assets/futuristic-hippo.png';

export const FuturisticHippo = () => {
  return (
    <div className="relative z-10 flex items-center justify-center animate-float">
      <img
        src={hippoCharacter}
        alt="Futuristic Hippo character"
        className="w-56 h-56 object-contain"
        style={{ filter: 'drop-shadow(0 0 25px rgba(147, 51, 234, 0.6)) drop-shadow(0 0 50px rgba(59, 130, 246, 0.4))' }}
        loading="lazy"
      />
    </div>
  );
};