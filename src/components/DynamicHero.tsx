import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { Lock } from "lucide-react";

export const DynamicHero = () => {
  const { vaultWorthy, loading } = useTop10Photos();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const heroPhotos = vaultWorthy.slice(0, 3);

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
      <section ref={heroRef} className="relative h-screen overflow-hidden bg-background film-grain">
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="relative z-10 flex h-full items-center justify-center text-center px-6">
          <div className="max-w-4xl">
            <h1 className="font-black text-6xl md:text-8xl text-foreground mb-6">
              VAULT
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-12 font-light leading-relaxed">
              Share the best of your camera roll with the world.
            </p>
            <Button 
              size="lg"
              className="group relative bg-foreground/5 backdrop-blur-sm text-foreground font-black px-14 py-7 text-lg rounded-full overflow-hidden shadow-[0_0_40px_hsla(45,70%,52%,0.3),0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_60px_hsla(45,70%,52%,0.6),0_8px_30px_rgba(0,0,0,0.4)] hover:scale-105 hover:bg-foreground/10 transition-all duration-500 border-2 border-vault-gold"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-vault-gold/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <Lock className="mr-2 h-5 w-5 relative z-10 text-vault-gold" />
              <span className="relative z-10">UNLOCK YOUR VAULT</span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Parallax speed multiplier (0.5 = half speed of scroll)
  const parallaxOffset = scrollY * 0.5;

  return (
    <section ref={heroRef} className="relative h-screen overflow-hidden film-grain">
      {/* Background: Rotating through top 3 with parallax */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${parallaxOffset}px)` }}>
        {heroPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
              index === currentSlide ? 'opacity-40' : 'opacity-0'
            }`}
          >
            <img 
              src={photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover blur-[2px] scale-110"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>
      
      {/* Hero content - fixed position, no parallax */}
      <div className="relative z-20 flex h-full items-center justify-center text-center px-4 md:px-6">
        <div className="max-w-4xl">
          <h1 className="font-black text-5xl sm:text-6xl md:text-8xl text-foreground mb-4 md:mb-6 drop-shadow-2xl">
            VAULT
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/90 mb-2 md:mb-4 font-light leading-relaxed drop-shadow-lg px-4">
            Share the best of your camera roll with the world.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 md:mb-12 drop-shadow-md">
            AI finds your best work in seconds.
          </p>
          <Button 
            size="lg"
            className="group relative bg-foreground/5 backdrop-blur-sm text-foreground font-black px-8 sm:px-10 md:px-14 py-5 md:py-7 text-sm sm:text-base md:text-lg rounded-full overflow-hidden shadow-[0_0_40px_hsla(45,70%,52%,0.3),0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_60px_hsla(45,70%,52%,0.6),0_8px_30px_rgba(0,0,0,0.4)] hover:scale-105 hover:bg-foreground/10 transition-all duration-500 border-2 border-vault-gold"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-vault-gold/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <Lock className="mr-2 h-4 w-4 md:h-5 md:w-5 relative z-10 text-vault-gold" />
            <span className="relative z-10">UNLOCK YOUR VAULT</span>
          </Button>
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
