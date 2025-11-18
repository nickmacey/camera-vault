import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Shield } from "lucide-react";
import { cleanDescription, cleanScore } from "@/lib/utils";

import { Tables } from "@/integrations/supabase/types";

interface PhotoCardProps {
  photo: Tables<"photos"> & {
    url: string;
    thumbnailUrl?: string;
    name?: string;
    description?: string;
    score?: number;
  };
  onClick?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const PhotoCard = ({ photo, onClick, selectionMode, isSelected, onToggleSelect }: PhotoCardProps) => {
  const displayScore = cleanScore(photo.score, photo.description);
  const displayDescription = cleanDescription(photo.description);
  const isVaultWorthy = displayScore !== null && displayScore > 8.5;
  const isHighValue = displayScore !== null && displayScore >= 7 && displayScore <= 8.5;

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.stopPropagation();
      onToggleSelect?.();
    } else {
      onClick?.();
    }
  };

  return (
    <Card
      className={`overflow-hidden group vault-transition cursor-pointer bg-vault-dark-gray border-2 ${
        isSelected 
          ? 'border-vault-gold vault-glow-gold' 
          : isVaultWorthy
            ? 'border-vault-gold hover:vault-glow-gold'
            : isHighValue
              ? 'border-vault-green/50 hover:border-vault-green'
              : 'border-vault-mid-gray hover:border-vault-platinum'
      }`}
      onClick={handleClick}
    >
      <div className="aspect-square relative overflow-hidden bg-vault-black">
        <img
          src={photo.url}
          alt={photo.filename}
          className="w-full h-full object-cover group-hover:scale-105 vault-transition"
          loading="lazy"
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-vault-black/90 via-vault-black/50 to-transparent opacity-0 group-hover:opacity-100 vault-transition" />
        
        {selectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              onClick={(e) => e.stopPropagation()}
              className="h-6 w-6 bg-vault-dark-gray border-2 border-vault-gold"
            />
          </div>
        )}
        
        {!selectionMode && (
          <>
            {/* Vault Worthy Badge */}
            {isVaultWorthy && (
              <div className="absolute top-3 right-3 bg-vault-gold/90 backdrop-blur-sm text-vault-black px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 uppercase tracking-wide vault-glow-gold">
                <Lock className="h-3 w-3" />
                VAULT WORTHY
              </div>
            )}
            
            {/* Watermark Badge */}
            {photo.watermarked && !isVaultWorthy && (
              <div className="absolute top-3 right-3 bg-vault-gold/90 backdrop-blur-sm text-vault-black p-2 rounded-full vault-glow-gold" title="Protected">
                <Shield className="h-3.5 w-3.5" />
              </div>
            )}
            
            {/* Score Display (on hover or always for high scores) */}
            {displayScore !== null && (
              <div className={`absolute bottom-3 right-3 font-mono text-2xl font-bold backdrop-blur-sm px-3 py-1.5 rounded-lg ${
                isVaultWorthy 
                  ? 'text-vault-gold bg-vault-black/80 border border-vault-gold/30'
                  : isHighValue
                    ? 'text-vault-green bg-vault-black/80 border border-vault-green/30 opacity-0 group-hover:opacity-100'
                    : 'text-vault-light-gray bg-vault-black/80 border border-vault-mid-gray opacity-0 group-hover:opacity-100'
              } vault-transition`}>
                {displayScore.toFixed(1)}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 bg-vault-dark-gray">
        <h3 className="font-bold text-sm mb-1 truncate text-vault-platinum uppercase tracking-wide">
          {photo.filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, "")}
        </h3>
        {displayDescription && (
          <p className="text-xs text-vault-light-gray line-clamp-2 leading-relaxed">{displayDescription}</p>
        )}
      </div>
    </Card>
  );
};

export default PhotoCard;
