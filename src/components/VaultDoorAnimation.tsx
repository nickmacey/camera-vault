import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface VaultDoorAnimationProps {
  onComplete: () => void;
}

export const VaultDoorAnimation = ({ onComplete }: VaultDoorAnimationProps) => {
  const [stage, setStage] = useState<'lock' | 'opening' | 'complete'>('lock');

  useEffect(() => {
    // Stage 1: Show lock for 1.2s
    const lockTimer = setTimeout(() => {
      setStage('opening');
    }, 1200);

    // Stage 2: Door opening animation for 1.5s
    const openTimer = setTimeout(() => {
      setStage('complete');
    }, 2700);

    // Stage 3: Fade out and complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(lockTimer);
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-700 ${
        stage === 'complete' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Lock Icon - Fades in then glows */}
      <div 
        className={`absolute transition-all duration-700 ${
          stage === 'lock' 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 animate-pulse">
            <Lock 
              className="w-32 h-32 text-[#D4AF37] blur-xl opacity-60" 
              strokeWidth={1.5}
            />
          </div>
          {/* Main lock */}
          <Lock 
            className="w-32 h-32 text-[#D4AF37] relative z-10" 
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Vault Door - Splits and opens */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
          stage === 'opening' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Left door */}
        <div 
          className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-black via-[#0A0A0A] to-[#1A1A1A] border-r border-[#D4AF37]/20 transition-transform duration-1500 ease-in-out ${
            stage === 'opening' ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          {/* Door details */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-64 border-2 border-[#D4AF37]/30 rounded-lg" />
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <Lock className="w-8 h-8 text-[#D4AF37]/50" strokeWidth={1.5} />
          </div>
        </div>

        {/* Right door */}
        <div 
          className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black via-[#0A0A0A] to-[#1A1A1A] border-l border-[#D4AF37]/20 transition-transform duration-1500 ease-in-out ${
            stage === 'opening' ? 'translate-x-full' : 'translate-x-0'
          }`}
        >
          {/* Door details */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-64 border-2 border-[#D4AF37]/30 rounded-lg" />
          <div className="absolute left-12 top-1/2 -translate-y-1/2">
            <Lock className="w-8 h-8 text-[#D4AF37]/50" strokeWidth={1.5} />
          </div>
        </div>

        {/* Center seam glow */}
        <div 
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-transparent via-[#D4AF37]/40 to-transparent transition-opacity duration-1000 ${
            stage === 'opening' ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>

      {/* VAULT text - appears as doors open */}
      <div 
        className={`absolute transition-all duration-700 delay-300 ${
          stage === 'opening' 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
      >
        <h1 className="text-8xl font-black tracking-tight text-[#D4AF37] font-mono">
          VAULT
        </h1>
      </div>
    </div>
  );
};
