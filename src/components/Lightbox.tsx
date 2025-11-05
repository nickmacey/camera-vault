import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export const Lightbox = ({ photo, photos, onClose, onNavigate }: LightboxProps) => {
  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

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
        className="max-w-7xl max-h-[90vh] mx-4 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {photo.score && (
            <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-lg font-bold px-4 py-2 rounded-full shadow-lg">
              {photo.score.toFixed(1)}
            </div>
          )}
          <img
            src={photo.url}
            alt={photo.filename}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        {/* Photo info */}
        <div className="mt-4 text-center max-w-2xl">
          <h3 className="text-xl font-semibold text-white mb-2">
            {photo.filename}
          </h3>
          {photo.description && (
            <p className="text-gray-300 text-sm leading-relaxed">
              {photo.description}
            </p>
          )}
          {photo.width && photo.height && (
            <p className="text-gray-400 text-xs mt-2">
              {photo.width} × {photo.height}
            </p>
          )}
        </div>

        {/* Counter */}
        <div className="text-gray-400 text-sm mt-4">
          {currentIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
};
