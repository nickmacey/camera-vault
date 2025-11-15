import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { ArrowRight } from "lucide-react";

export const DynamicHero = () => {
  const { vaultWorthy, loading } = useTop10Photos();
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroPhotos = vaultWorthy.slice(0, 3);

  useEffect(() => {
    if (heroPhotos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroPhotos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroPhotos.length]);

  if (loading || heroPhotos.length === 0) {
    return (
      <section className="relative h-screen overflow-hidden bg-vault-black">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black/60 via-vault-black/80 to-vault-black" />
        <div className="relative z-10 flex h-full items-center justify-center text-center px-6">
          <div className="max-w-4xl">
            <h1 className="font-black text-6xl md:text-8xl text-white mb-6">
              VAULT
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-12 font-light leading-relaxed">
              The difference between a camera roll<br />and a career.
            </p>
            <Button 
              size="lg"
              className="bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold px-12 py-6 text-lg rounded-lg shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] transition-all"
            >
              Discover Your Best Work
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background: Rotating through top 3 */}
      <div className="absolute inset-0">
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
              className="w-full h-full object-cover blur-sm scale-105"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-vault-black/60 via-vault-black/80 to-vault-black" />
      </div>
      
      {/* Hero content */}
      <div className="relative z-10 flex h-full items-center justify-center text-center px-6">
        <div className="max-w-4xl">
          <h1 className="font-black text-6xl md:text-8xl text-white mb-6 drop-shadow-2xl">
            VAULT
          </h1>
          <p className="text-2xl md:text-3xl text-gray-100 mb-4 font-light leading-relaxed drop-shadow-lg">
            The difference between a camera roll<br />and a career.
          </p>
          <p className="text-lg text-gray-300 mb-12 drop-shadow-md">
            AI finds your best work in seconds.
          </p>
          <Button 
            size="lg"
            className="bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold px-12 py-6 text-lg rounded-lg shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:shadow-[0_0_50px_rgba(212,175,55,0.7)] transition-all"
          >
            Discover Your Best Work
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Slide indicators */}
      {heroPhotos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {heroPhotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1 rounded-full transition-all ${
                i === currentSlide 
                  ? 'w-12 bg-vault-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]' 
                  : 'w-6 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
