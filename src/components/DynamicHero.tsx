import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import heroBackground from "@/assets/hero-background.jpg";

interface DynamicHeroProps {
  onCTAClick?: () => void;
}

export const DynamicHero = ({ onCTAClick }: DynamicHeroProps) => {
  const { vaultWorthy, highValue, loading } = useTop10Photos();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  // Combine vault-worthy and high-value photos for more variety
  const heroPhotos = [...vaultWorthy, ...highValue].slice(0, 10);

  useEffect(() => {
    if (heroPhotos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroPhotos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroPhotos.length]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const scrollProgress = Math.max(0, -rect.top);
        setScrollY(scrollProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading || heroPhotos.length === 0) {
    return (
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {/* Stunning 4K Background */}
        <div className="absolute inset-0">
          <img 
            src={heroBackground}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
        </div>
        
        <div className="relative z-10 flex h-full items-center justify-center text-center px-4 md:px-6">
          <div className="max-w-5xl">
            <h1 className="font-black text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-foreground mb-6 md:mb-8 drop-shadow-2xl tracking-tight vault-text-gradient">
              VAULT
            </h1>
            <div className="mb-8 md:mb-14">
              <p className="text-2xl sm:text-3xl md:text-5xl font-light text-foreground/95 drop-shadow-xl leading-tight">
                Unlock the magic in your moments.
              </p>
            </div>
            <Button 
              size="lg"
              onClick={onCTAClick}
              className="group relative bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 backdrop-blur-sm hover:from-primary/30 hover:to-accent/30 font-black px-8 sm:px-12 md:px-16 py-6 md:py-8 text-sm sm:text-base md:text-xl rounded-full overflow-hidden shadow-[0_0_60px_hsla(var(--primary)/0.6)] hover:shadow-[0_0_100px_hsla(var(--primary)/0.9)] hover:scale-105 transition-all duration-500 border-2 border-primary/50 animate-pulse"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-glow font-black tracking-wider drop-shadow-[0_0_15px_hsla(var(--primary)/0.8)]">
                CONNECT YOUR PHOTOS
              </span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Parallax speed multipliers for depth effect
  const bgParallaxOffset = scrollY * 0.5;    // Background moves slowest
  const textParallaxOffset = scrollY * 0.3;   // Text moves medium speed
  const buttonParallaxOffset = scrollY * 0.15; // Button moves fastest
  
  // Calculate fade-out opacity (fades out over first 60% of viewport height)
  const fadeThreshold = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 600;
  const contentOpacity = Math.max(0, 1 - (scrollY / fadeThreshold));

  return (
    <section ref={heroRef} className="relative h-screen overflow-hidden">
      {/* Background: Rotating through top 5 with parallax and 4K backdrop */}
      <div className="absolute inset-0 z-0">
        {/* 4K Background Layer */}
        <div className="absolute inset-0">
          <img 
            src={heroBackground}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* User Photos Layer */}
        <div className="absolute inset-0" style={{ transform: `translateY(${bgParallaxOffset}px)` }}>
          {heroPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
                index === currentSlide ? 'opacity-30' : 'opacity-0'
              }`}
            >
              <img 
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover blur-[2px] scale-110"
              />
            </div>
          ))}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
      </div>
      
      {/* Hero content - with layered parallax and fade-out */}
      <div 
        className="relative z-20 flex h-full items-center justify-center text-center px-4 md:px-6"
        style={{ opacity: contentOpacity, transition: 'opacity 0.1s ease-out' }}
      >
        <div className="max-w-5xl">
          <div style={{ transform: `translateY(${textParallaxOffset}px)`, transition: 'transform 0.1s ease-out' }}>
            <h1 className="font-black text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-foreground mb-6 md:mb-8 drop-shadow-2xl tracking-tight vault-text-gradient">
              VAULT
            </h1>
            <div className="mb-8 md:mb-14">
              <p className="text-2xl sm:text-3xl md:text-5xl font-light text-foreground/95 drop-shadow-xl leading-tight">
                Unlock the magic in your moments.
              </p>
            </div>
          </div>
          <div style={{ transform: `translateY(${buttonParallaxOffset}px)`, transition: 'transform 0.1s ease-out' }}>
            <Button
            size="lg"
            onClick={onCTAClick}
            className="group relative bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 backdrop-blur-sm hover:from-primary/30 hover:to-accent/30 font-black px-8 sm:px-12 md:px-16 py-6 md:py-8 text-sm sm:text-base md:text-xl rounded-full overflow-hidden shadow-[0_0_60px_hsla(var(--primary)/0.6)] hover:shadow-[0_0_100px_hsla(var(--primary)/0.9)] hover:scale-105 transition-all duration-500 border-2 border-primary/50 animate-pulse"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-glow font-black tracking-wider drop-shadow-[0_0_15px_hsla(var(--primary)/0.8)]">
              CONNECT YOUR PHOTOS
            </span>
          </Button>
          </div>
        </div>
      </div>
      
      {/* Slide indicators */}
      {heroPhotos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {heroPhotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentSlide 
                  ? 'w-12 bg-vault-gold shadow-[0_0_10px_hsla(45,70%,52%,0.8)]' 
                  : 'w-6 bg-foreground/30 hover:bg-foreground/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
