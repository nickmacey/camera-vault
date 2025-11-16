import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Shield, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScoreBadge from "./ScoreBadge";

interface VaultGalleryProps {
  photos: any[];
  onPhotoSelect: (photo: any) => void;
  onEnhance: () => void;
  onProtect: () => void;
  onDeploy: () => void;
  onUploadMore: () => void;
}

export const VaultGallery = ({
  photos,
  onPhotoSelect,
  onEnhance,
  onProtect,
  onDeploy,
  onUploadMore,
}: VaultGalleryProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);

  const handlePhotoClick = (photo: any) => {
    setSelectedPhoto(photo);
    onPhotoSelect(photo);
  };

  const handleCloseDetail = () => {
    setSelectedPhoto(null);
  };

  // Calculate layout positions for floating gallery
  const getPhotoPosition = (index: number, total: number) => {
    const radius = 600;
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.6; // Flatten vertically
    return { x, y };
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gallery wall - floating images */}
      <div className="relative w-full h-full">
        {photos.map((photo, index) => {
          const { x, y } = getPhotoPosition(index, photos.length);
          const isHovered = hoveredPhoto === photo.id;
          const isSelected = selectedPhoto?.id === photo.id;

          return (
            <motion.div
              key={photo.id}
              className="absolute top-1/2 left-1/2 cursor-pointer"
              style={{
                x: x,
                y: y,
                zIndex: isSelected ? 50 : isHovered ? 40 : 10,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: isSelected ? 1.5 : isHovered ? 1.2 : 1,
              }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
              }}
              onMouseEnter={() => setHoveredPhoto(photo.id)}
              onMouseLeave={() => setHoveredPhoto(null)}
              onClick={() => handlePhotoClick(photo)}
            >
              <div className="relative group">
                {/* Frame glow */}
                <div className="absolute -inset-2 bg-gradient-to-br from-vault-gold/20 to-transparent rounded-lg blur-xl" />
                
                {/* Photo */}
                <div className="relative w-64 h-48 rounded-lg overflow-hidden border-2 border-vault-gold/50 shadow-2xl">
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Vault Worthy badge */}
                  {photo.score >= 8.5 && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-vault-gold text-vault-dark px-3 py-1 rounded text-xs font-bold">
                        VAULT WORTHY
                      </div>
                    </div>
                  )}

                  {/* Score badge */}
                  <div className="absolute bottom-2 left-2">
                    <ScoreBadge score={photo.score} size="sm" />
                  </div>

                  {/* Hover overlay with details */}
                  {isHovered && !isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-vault-black/90 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-white text-sm font-bold mb-2">
                          {photo.filename}
                        </p>
                        <p className="text-vault-light-gray text-xs line-clamp-3">
                          {photo.description}
                        </p>
                      </div>
                      <div className="text-vault-light-gray text-xs">
                        {photo.width} × {photo.height}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected photo detail view */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-vault-black/95 z-50 flex items-center justify-center p-8"
            onClick={handleCloseDetail}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Image */}
                <div className="relative">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.filename}
                    className="w-full h-auto rounded-lg shadow-2xl"
                  />
                  <div className="absolute top-4 right-4">
                    <ScoreBadge score={selectedPhoto.score} size="lg" />
                  </div>
                </div>

                {/* Tools and info */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {selectedPhoto.filename}
                    </h2>
                    <p className="text-vault-light-gray mb-6">
                      {selectedPhoto.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-vault-light-gray mb-8">
                      <p>Dimensions: {selectedPhoto.width} × {selectedPhoto.height}</p>
                      <p>Score: {selectedPhoto.score?.toFixed(2)}</p>
                      {selectedPhoto.score >= 8.5 && (
                        <p className="text-vault-gold font-bold">⭐ VAULT WORTHY</p>
                      )}
                    </div>
                  </div>

                  {/* Action tools */}
                  <div className="space-y-3">
                    <Button
                      onClick={onEnhance}
                      className="w-full bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      ENHANCE
                    </Button>
                    <Button
                      onClick={onProtect}
                      className="w-full bg-vault-mid-gray hover:bg-vault-light-gray text-white font-bold"
                    >
                      <Shield className="mr-2 h-5 w-5" />
                      PROTECT
                    </Button>
                    <Button
                      onClick={onDeploy}
                      className="w-full bg-vault-dark-gray hover:bg-vault-mid-gray text-white font-bold"
                    >
                      <Send className="mr-2 h-5 w-5" />
                      DEPLOY
                    </Button>
                  </div>

                  <Button
                    onClick={handleCloseDetail}
                    variant="outline"
                    className="mt-4"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload more button */}
      <Button
        onClick={onUploadMore}
        className="fixed bottom-8 right-8 z-40 bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold"
        size="lg"
      >
        <Upload className="mr-2 h-5 w-5" />
        Upload More
      </Button>

      {/* Collection stats */}
      <div className="fixed top-8 left-8 z-40 text-white">
        <p className="text-4xl font-bold mb-2">{photos.length}</p>
        <p className="text-vault-light-gray text-sm">VAULT WORTHY IMAGES</p>
      </div>
    </div>
  );
};
