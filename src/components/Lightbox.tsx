import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanDescription, cleanScore } from "@/lib/utils";
import ScoreBadge from "@/components/ScoreBadge";

interface Photo {
  id: string;
  url: string;
  filename: string;
  description?: string;
  score?: number;
  width?: number;
  height?: number;
}

interface LightboxProps {
  photo: Photo;
  photos: Photo[];
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onWatermark?: (photo: Photo) => void;
}

export const Lightbox = ({ photo, photos, onClose, onNavigate, onWatermark }: LightboxProps) => {
  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;
  
  const displayScore = cleanScore(photo.score, photo.description);
  const displayDescription = cleanDescription(photo.description);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate("prev");
      if (e.key === "ArrowRight" && hasNext) onNavigate("next");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [onClose, onNavigate, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Watermark button */}
      {onWatermark && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-16 text-white hover:bg-white/10 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onWatermark(photo);
          }}
          title="Add Watermark"
        >
          <Shield className="h-6 w-6" />
        </Button>
      )}

      {/* Previous button */}
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate("prev");
          }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Next button */}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate("next");
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Image container */}
      <div
        className="max-w-7xl max-h-[90vh] mx-4 flex flex-col lg:flex-row items-start gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex-1">
          {displayScore !== null && displayScore >= 8.5 && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-gradient-to-r from-vault-gold via-vault-gold-dark to-vault-gold text-vault-dark px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.6)] border-2 border-vault-gold font-bold">
              <Lock className="h-4 w-4" />
              VAULT WORTHY
            </div>
          )}
          {displayScore !== null && (
            <div className="absolute top-4 right-4 z-10">
              <ScoreBadge score={displayScore} size="lg" />
            </div>
          )}
          <img
            src={photo.url}
            alt={photo.filename}
            className={`max-w-full max-h-[70vh] object-contain rounded-lg ${
              displayScore !== null && displayScore >= 8.5 
                ? 'border-4 border-vault-gold shadow-[0_0_40px_rgba(212,175,55,0.4)]' 
                : 'border border-white/20'
            }`}
          />
        </div>

        {/* Analysis Panel */}
        <div className="w-full lg:w-96 space-y-4 bg-black/60 backdrop-blur-md p-6 rounded-lg border border-white/10">
          {/* Overall Score */}
          <div className="text-center pb-4 border-b border-white/10">
            <div className="text-xs font-mono text-vault-gold tracking-wider mb-2">OVERALL SCORE</div>
            {displayScore !== null && (
              <>
                <div className="text-5xl font-mono font-bold text-white mb-2">
                  {displayScore.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">
                  {displayScore >= 8.5 ? 'Top 10% of your collection' :
                   displayScore >= 7.0 ? 'High value asset' :
                   displayScore >= 6.0 ? 'Above average quality' :
                   'Review for improvements'}
                </div>
                {displayScore >= 8.5 && (
                  <div className="mt-3 text-sm text-vault-gold font-semibold">
                    This asset will sell.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Photo Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 break-words">
              {photo.filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')}
            </h3>
            {photo.width && photo.height && (
              <div className="text-xs text-gray-400 font-mono">
                {photo.width} × {photo.height}
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {displayDescription && (
            <div className="space-y-2">
              <div className="text-xs font-mono text-vault-gold tracking-wider">AI ANALYSIS</div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {displayDescription}
              </p>
            </div>
          )}

          {/* Counter */}
          <div className="text-center pt-4 border-t border-white/10">
            <div className="text-xs text-gray-400 font-mono">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
