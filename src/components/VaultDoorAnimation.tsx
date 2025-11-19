import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface VaultDoorAnimationProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  delay: number;
  type: 'dust' | 'light' | 'spark';
}

export const VaultDoorAnimation = ({ onComplete }: VaultDoorAnimationProps) => {
  const [stage, setStage] = useState<'lock' | 'unlocking' | 'opening' | 'complete'>('lock');
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate explosion particles when unlocking starts
  useEffect(() => {
    if (stage === 'unlocking') {
      const newParticles: Particle[] = [];
      // Create 50 particles
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50;
        const velocity = 2 + Math.random() * 4;
        const type = i % 3 === 0 ? 'spark' : i % 2 === 0 ? 'light' : 'dust';
        
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: type === 'spark' ? 3 + Math.random() * 2 : 4 + Math.random() * 6,
          delay: Math.random() * 0.1,
          type,
        });
      }
      setParticles(newParticles);
    }
  }, [stage]);

  useEffect(() => {
    // Stage 1: Show lock for 1s
    const lockTimer = setTimeout(() => {
      setStage('unlocking');
    }, 1000);

    // Stage 2: Lock changes color and opens for 1.2s
    const unlockTimer = setTimeout(() => {
      setStage('opening');
    }, 2200);

    // Stage 3: Door opening animation for 1.5s
    const openTimer = setTimeout(() => {
      setStage('complete');
    }, 3700);

    // Stage 4: Fade out and complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4400);

    return () => {
      clearTimeout(lockTimer);
      clearTimeout(unlockTimer);
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
      {/* Particle Explosion - Appears during unlocking */}
      {stage === 'unlocking' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`absolute rounded-full ${
                particle.type === 'spark' 
                  ? 'bg-vault-gold animate-pulse' 
                  : particle.type === 'light'
                  ? 'bg-vault-gold/80 blur-sm'
                  : 'bg-vault-gold/60 blur-[2px]'
              }`}
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animation: `particle-explode 1.2s ease-out forwards`,
                animationDelay: `${particle.delay}s`,
                '--particle-x': `${particle.vx * 80}px`,
                '--particle-y': `${particle.vy * 80}px`,
                boxShadow: particle.type === 'spark' 
                  ? '0 0 20px rgba(212, 175, 55, 1), 0 0 40px rgba(212, 175, 55, 0.6)'
                  : '0 0 10px rgba(212, 175, 55, 0.8)',
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Lock Icon - Transitions through stages */}
      <div 
        className={`absolute transition-all duration-700 ${
          stage === 'lock' || stage === 'unlocking'
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
      >
        <div className="relative">
          {/* Glow effect - changes color during unlocking */}
          <div className={`absolute inset-0 animate-pulse ${
            stage === 'unlocking' ? 'animate-color-shift' : ''
          }`}>
            <Lock 
              className={`w-32 h-32 blur-xl opacity-60 transition-colors duration-1000 ${
                stage === 'unlocking' ? 'text-vault-green' : 'text-vault-gold'
              }`}
              strokeWidth={1.5}
            />
          </div>
          
          {/* Lock body - stays in place */}
          <div className="relative">
            <svg
              className={`w-32 h-32 relative z-10 transition-colors duration-1000 ${
                stage === 'unlocking' ? 'text-vault-green' : 'text-vault-gold'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Lock body */}
              <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
              <circle cx="12" cy="16" r="1" />
              
              {/* Lock shackle - animates upward when unlocking */}
              <path 
                d="M7 11V7a5 5 0 0 1 10 0v4"
                className={stage === 'unlocking' ? 'animate-lock-open' : ''}
                style={{ transformOrigin: 'center top' }}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Vault Door - Splits and opens */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
          stage === 'opening' || stage === 'complete' ? 'opacity-100' : 'opacity-0'
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
