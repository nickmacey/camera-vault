import { useState, useEffect, useRef } from "react";
import { Logo } from "./Logo";
import { SoundGenerator } from "@/lib/soundGenerator";

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
  type: 'dust' | 'light' | 'spark' | 'glow';
  rotation: number;
  rotationSpeed: number;
}

export const VaultDoorAnimation = ({ onComplete }: VaultDoorAnimationProps) => {
  const [stage, setStage] = useState<'initial' | 'gathering' | 'unlock' | 'opening' | 'complete'>('initial');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [orbitingParticles, setOrbitingParticles] = useState<Particle[]>([]);
  const [cameraFlash, setCameraFlash] = useState(false);
  const soundGeneratorRef = useRef<SoundGenerator | null>(null);

  // Initialize sound generator
  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator();
    return () => {
      soundGeneratorRef.current?.close();
    };
  }, []);

  // Generate orbiting particles
  useEffect(() => {
    const orbits: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      orbits.push({
        id: i,
        x: Math.cos(angle) * 150,
        y: Math.sin(angle) * 150,
        vx: 0,
        vy: 0,
        size: 3 + Math.random() * 3,
        delay: i * 0.05,
        type: 'glow',
        rotation: angle,
        rotationSpeed: 0.02,
      });
    }
    setOrbitingParticles(orbits);
  }, []);

  // Generate explosion particles
  useEffect(() => {
    if (stage === 'unlock') {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 80; i++) {
        const angle = (Math.PI * 2 * i) / 80;
        const velocity = 3 + Math.random() * 6;
        const type = i % 4 === 0 ? 'spark' : i % 3 === 0 ? 'light' : i % 2 === 0 ? 'glow' : 'dust';
        
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: type === 'spark' ? 2 + Math.random() * 3 : 4 + Math.random() * 8,
          delay: Math.random() * 0.15,
          type,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
        });
      }
      setParticles(newParticles);
    }
  }, [stage]);

  useEffect(() => {
    // Stage 1: Initial appear - 1.5s
    const initialTimer = setTimeout(() => {
      setStage('gathering');
    }, 1500);

    // Stage 2: Energy gathering - 2s
    const gatherTimer = setTimeout(() => {
      setStage('unlock');
    }, 3500);

    // Stage 3: Unlock with burst - 1.5s
    const unlockTimer = setTimeout(() => {
      setStage('unlock');
    }, 3500);

    // Brief pause after unlock before flash - 4.2s
    // Camera flash (with dramatic pause before) - 4.8s
    const flashTimer = setTimeout(() => {
      setCameraFlash(true);
      // Delay sound slightly to sync with visual flash peak (at ~15% of animation = 0.225s)
      setTimeout(() => {
        soundGeneratorRef.current?.playCameraShutter();
      }, 200);
    }, 4800);

    // Stage 4: Door opening - delayed for flash to complete + pause after
    const openTimer = setTimeout(() => {
      setStage('opening');
      setCameraFlash(false);
    }, 6800);

    // Stage 5: Complete - adjusted for longer pauses and flash
    const stageCompleteTimer = setTimeout(() => {
      setStage('complete');
    }, 8800);

    // Stage 6: Fade and complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 9600);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(gatherTimer);
      clearTimeout(unlockTimer);
      clearTimeout(flashTimer);
      clearTimeout(openTimer);
      clearTimeout(stageCompleteTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000 ${
        stage === 'complete' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)',
      }}
    >
      {/* Animated background rays */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: '200%',
              height: '2px',
              background: `linear-gradient(to right, transparent, ${stage === 'unlock' ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.15)'}, transparent)`,
              transform: `rotate(${i * 30}deg) translateX(-50%)`,
              animation: stage === 'gathering' || stage === 'unlock' ? `rotate-ray 8s linear infinite` : 'none',
              animationDelay: `${i * 0.1}s`,
              opacity: stage === 'initial' ? 0 : 1,
              transition: 'opacity 1s ease-in',
            }}
          />
        ))}
      </div>

      {/* Pulsing rings */}
      {(stage === 'gathering' || stage === 'unlock') && (
        <>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-vault-gold/30"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                animation: `pulse-ring ${3 + i * 0.5}s ease-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Orbiting particles */}
      {stage !== 'complete' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {orbitingParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute"
              style={{
                animation: stage === 'gathering' ? `orbit ${5 + particle.id * 0.1}s linear infinite` : 'none',
                animationDelay: `${particle.delay}s`,
              }}
            >
              <div
                className={`rounded-full ${stage === 'unlock' ? 'bg-white' : 'bg-vault-gold'}`}
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  boxShadow: `0 0 ${stage === 'unlock' ? '20px' : '10px'} ${stage === 'unlock' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(212, 175, 55, 0.6)'}`,
                  opacity: stage === 'initial' ? 0 : 1,
                  transition: 'all 0.5s ease-in',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Explosion flash */}
      {stage === 'unlock' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className="absolute rounded-full bg-white"
            style={{
              width: '40px',
              height: '40px',
              animation: 'massive-flash 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              boxShadow: '0 0 100px 50px rgba(255, 255, 255, 0.9), 0 0 200px 100px rgba(212, 175, 55, 0.7), 0 0 300px 150px rgba(212, 175, 55, 0.4)',
            }}
          />
        </div>
      )}

      {/* Explosion particles */}
      {stage === 'unlock' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`absolute rounded-full`}
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: particle.type === 'spark' 
                  ? 'linear-gradient(135deg, #ffffff, #d4af37)' 
                  : particle.type === 'light'
                  ? 'radial-gradient(circle, #ffffff, #d4af37)'
                  : particle.type === 'glow'
                  ? 'radial-gradient(circle, #d4af37, transparent)'
                  : 'radial-gradient(circle, #d4af37, #8b7355)',
                animation: `explode-particle 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                animationDelay: `${particle.delay}s`,
                boxShadow: particle.type === 'spark' || particle.type === 'light'
                  ? '0 0 15px rgba(212, 175, 55, 0.8), 0 0 30px rgba(212, 175, 55, 0.4)'
                  : 'none',
                '--vx': particle.vx,
                '--vy': particle.vy,
              } as any}
            />
          ))}
        </div>
      )}

      {/* Central lock icon with enhanced animations */}
      <div 
        className={`relative z-10 transition-all duration-1000 ${
          stage === 'opening' ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Outer glow sphere */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            width: '200px',
            height: '200px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)',
            animation: stage === 'gathering' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            scale: stage === 'unlock' ? '1.5' : '1',
            opacity: stage === 'unlock' ? 0 : 1,
            transition: 'all 0.6s ease-out',
          }}
        />

        {/* Lock container */}
        <div 
          className={`relative rounded-full p-1 bg-gradient-to-br from-vault-gold via-vault-gold/80 to-vault-gold/50 transition-all duration-700 ${
            stage === 'unlock' ? 'animate-spin' : ''
          }`}
          style={{
            boxShadow: stage === 'unlock' 
              ? '0 0 60px rgba(212, 175, 55, 1), 0 0 120px rgba(212, 175, 55, 0.6)' 
              : '0 0 30px rgba(212, 175, 55, 0.5)',
          }}
        >
          <div 
            className={`rounded-full bg-vault-black p-8 border-4 transition-all duration-500 ${
              stage === 'unlock' ? 'border-white' : 'border-vault-gold/40'
            }`}
          >
            {/* Logo icon */}
            <div 
              className={`relative transition-all duration-500 ${
                stage === 'unlock' ? 'animate-pulse' : ''
              }`}
            >
              <div className={`transition-all duration-500 ${
                stage === 'unlock' ? '[filter:drop-shadow(0_0_30px_rgba(255,255,255,1))]' : '[filter:drop-shadow(0_0_15px_rgba(212,175,55,0.7))]'
              }`}>
                <Logo variant="icon" size="lg" />
              </div>
              
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                style={{
                  animation: stage === 'gathering' ? 'shimmer-slide 2s ease-in-out infinite' : 'none',
                }}
              />
              
              {/* Camera flash on center circle - Cascading waves */}
              {cameraFlash && (
                <>
                  {/* Central flash point */}
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      width: '40px',
                      height: '40px',
                    }}
                  >
                    <div 
                      className="absolute inset-0 rounded-full bg-white"
                      style={{
                        animation: 'camera-flash 1.5s cubic-bezier(0.22, 0, 0.18, 1) forwards',
                        boxShadow: '0 0 60px 30px rgba(255, 255, 255, 1), 0 0 120px 60px rgba(255, 255, 255, 0.9), 0 0 180px 90px rgba(212, 175, 55, 0.7)',
                      }}
                    />
                  </div>
                  
                  {/* Cascading waves expanding from center */}
                  {[0, 1, 2, 3, 4].map((wave) => (
                    <div
                      key={wave}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderColor: wave < 2 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(212, 175, 55, 0.8)',
                        animation: `flash-wave-${wave} 1.6s cubic-bezier(0.22, 0, 0.18, 1) forwards`,
                        animationDelay: `${wave * 0.12}s`,
                        boxShadow: wave < 2 
                          ? '0 0 40px rgba(255, 255, 255, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.5)'
                          : '0 0 30px rgba(212, 175, 55, 0.6), inset 0 0 20px rgba(212, 175, 55, 0.4)',
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Door opening animation */}
      {(stage === 'opening' || stage === 'complete') && (
        <div className="absolute inset-0 flex">
          {/* Left door */}
          <div 
            className="w-1/2 h-full bg-gradient-to-r from-vault-black via-zinc-900 to-zinc-800 border-r-4 border-vault-gold/50"
            style={{
              animation: 'slide-left 2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              boxShadow: 'inset -20px 0 40px rgba(0, 0, 0, 0.8), 20px 0 60px rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-8xl font-bold text-vault-gold/30 tracking-[0.5em] mr-8">
                V
              </div>
            </div>
          </div>
          
          {/* Right door */}
          <div 
            className="w-1/2 h-full bg-gradient-to-l from-vault-black via-zinc-900 to-zinc-800 border-l-4 border-vault-gold/50"
            style={{
              animation: 'slide-right 2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              boxShadow: 'inset 20px 0 40px rgba(0, 0, 0, 0.8), -20px 0 60px rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-8xl font-bold text-vault-gold/30 tracking-[0.5em] ml-8">
                AULT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes rotate-ray {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(150px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(150px) rotate(-360deg);
          }
        }
        
        @keyframes massive-flash {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(100);
            opacity: 0;
          }
        }
        
        @keyframes explode-particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--vx) * 200px), calc(var(--vy) * 200px)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.9;
          }
        }
        
        @keyframes shimmer-slide {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
        
        @keyframes slide-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @keyframes slide-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes camera-flash {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          15% {
            transform: scale(1.2);
            opacity: 0.8;
          }
          35% {
            transform: scale(2);
            opacity: 1;
          }
          100% {
            transform: scale(5);
            opacity: 0;
          }
        }
        
        @keyframes flash-wave-0 {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(25);
            opacity: 0;
          }
        }
        
        @keyframes flash-wave-1 {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) scale(30);
            opacity: 0;
          }
        }
        
        @keyframes flash-wave-2 {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(35);
            opacity: 0;
          }
        }
        
        @keyframes flash-wave-3 {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(40);
            opacity: 0;
          }
        }
        
        @keyframes flash-wave-4 {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(45);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
