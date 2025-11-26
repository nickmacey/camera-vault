import { useEffect, useState } from "react";
// Animated lock icon uses inline SVG, no image import needed

interface AnimatedLockIconProps {
  size?: number;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
  type: 'float' | 'sparkle';
}

export const AnimatedLockIcon = ({ size = 192, className = "" }: AnimatedLockIconProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate particles on mount
  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      // Floating particles
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 180 - 90, // -90 to 90
          y: Math.random() * 180 - 90,
          delay: Math.random() * 4,
          duration: 3 + Math.random() * 2,
          size: 2 + Math.random() * 3,
          type: 'float',
        });
      }
      // Sparkle particles
      for (let i = 15; i < 25; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 160 - 80,
          y: Math.random() * 160 - 80,
          delay: Math.random() * 3,
          duration: 1 + Math.random(),
          size: 3 + Math.random() * 2,
          type: 'sparkle',
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Floating & Sparkle Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full pointer-events-none ${
            particle.type === 'float'
              ? 'bg-vault-gold/60 blur-[1px] animate-float-up'
              : 'bg-vault-gold animate-pulse'
          }`}
          style={{
            left: `calc(50% + ${particle.x}px)`,
            top: `calc(50% + ${particle.y}px)`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            boxShadow: particle.type === 'float' 
              ? '0 0 10px rgba(212, 175, 55, 0.8)' 
              : '0 0 8px rgba(212, 175, 55, 1), 0 0 16px rgba(212, 175, 55, 0.6)',
          }}
        />
      ))}

      {/* Outer glow ring - pulsing */}
      <div className="absolute inset-0 rounded-full bg-vault-gold/20 animate-ping" 
           style={{ animationDuration: '3s' }} />
      
      {/* Middle glow ring - rotating */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-vault-gold/40 via-transparent to-vault-gold/40 animate-spin" 
           style={{ animationDuration: '8s' }} />
      
      {/* Static glow halo */}
      <div className="absolute inset-0 rounded-full bg-vault-gold/30 blur-xl" />
      <div className="absolute inset-0 rounded-full bg-vault-gold/20 blur-2xl scale-125" />
      
      {/* Logo with subtle animations */}
      <div className="relative animate-[scale-in_0.5s_ease-out]">
          <svg
            viewBox="0 0 100 100"
            className="text-vault-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] transition-transform duration-300 hover:scale-110"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <rect
              x="32"
              y="42"
              width="36"
              height="28"
              rx="4"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="50"
              cy="56"
              r="6"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M38 42v-6a12 12 0 0 1 24 0v6"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[slide-in-right_3s_ease-in-out_infinite]" 
               style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Corner highlights */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-vault-gold/60 rounded-full blur-sm animate-pulse" 
           style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-vault-gold/40 rounded-full blur-sm animate-pulse" 
           style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
    </div>
  );
};
