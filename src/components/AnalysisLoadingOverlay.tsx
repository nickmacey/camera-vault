import { useState, useEffect } from "react";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { Lock, Sparkles } from "lucide-react";

interface AnalysisLoadingOverlayProps {
  currentPhoto: number;
  totalPhotos: number;
  visible: boolean;
}

export const AnalysisLoadingOverlay = ({
  currentPhoto,
  totalPhotos,
  visible,
}: AnalysisLoadingOverlayProps) => {
  const { top10Photos, loading: photosLoading } = useTop10Photos();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const backgroundPhotos = top10Photos.length > 0 
    ? top10Photos.slice(0, 5) // Use top 5 for rotation
    : [];

  useEffect(() => {
    if (!visible || backgroundPhotos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % backgroundPhotos.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, [visible, backgroundPhotos.length]);

  if (!visible) return null;

  const progress = totalPhotos > 0 ? (currentPhoto / totalPhotos) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-vault-black/95 backdrop-blur-xl z-50 flex items-center justify-center">
      {/* Background: Rotating top photos */}
      <div className="absolute inset-0 overflow-hidden">
        {backgroundPhotos.length > 0 ? (
          backgroundPhotos.map((photo, i) => (
            <div
              key={photo.id}
              className={`absolute inset-0 transition-opacity duration-[3000ms] ${
                i === currentPhotoIndex ? 'opacity-10' : 'opacity-0'
              }`}
            >
              <img 
                src={photo.url}
                alt=""
                className="w-full h-full object-cover blur-2xl scale-110"
              />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-vault-black via-vault-dark to-vault-black" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-vault-black/60 via-vault-black/80 to-vault-black" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl">
        {/* Animated icon */}
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 border-4 border-vault-gold/30 border-t-vault-gold rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-10 w-10 text-vault-gold animate-pulse" />
          </div>
        </div>
        
        {/* Status text */}
        <h3 className="font-black text-3xl md:text-4xl text-white mb-3 animate-fade-in">
          DISCOVERING VALUE
        </h3>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="h-4 w-4 text-vault-gold animate-pulse" />
          <p className="text-vault-light-gray text-lg">
            AI analyzing your work
          </p>
        </div>
        
        {/* Progress info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-vault-light-gray font-mono">
            <span>Photo {currentPhoto} of {totalPhotos}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-vault-dark-gray rounded-full overflow-hidden border border-vault-gold/20">
            <div 
              className="h-full bg-gradient-to-r from-vault-gold via-vault-gold-dark to-vault-gold transition-all duration-500 ease-out shadow-[0_0_20px_rgba(212,175,55,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Tips */}
        <div className="mt-8 p-4 bg-vault-gold/5 border border-vault-gold/20 rounded-lg backdrop-blur-sm">
          <p className="text-xs text-vault-light-gray leading-relaxed">
            {backgroundPhotos.length > 0 
              ? "Your previous best work rotates in the background while we discover your next vault-worthy assets."
              : "AI is evaluating composition, technical quality, commercial appeal, and emotional impact."}
          </p>
        </div>
        
        {/* Current analyzing image preview (if available) */}
        {backgroundPhotos.length > 0 && (
          <div className="mt-6 flex justify-center gap-2">
            {backgroundPhotos.slice(0, 3).map((photo, i) => (
              <div 
                key={photo.id}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  i === currentPhotoIndex 
                    ? 'border-vault-gold scale-110 shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                    : 'border-vault-gold/30 opacity-50'
                }`}
              >
                <img 
                  src={photo.url} 
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
