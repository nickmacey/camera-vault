import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cleanDescription, cleanScore } from "@/lib/utils";

interface PhotoCardProps {
  photo: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    name?: string;
    description?: string;
    score?: number;
    width?: number;
    height?: number;
  };
  onClick?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const PhotoCard = ({ photo, onClick, selectionMode, isSelected, onToggleSelect }: PhotoCardProps) => {
  const displayScore = cleanScore(photo.score, photo.description);
  const displayDescription = cleanDescription(photo.description);

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
      className={`overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleClick}
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={photo.filename}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {selectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.()}
              onClick={(e) => e.stopPropagation()}
              className="h-6 w-6 bg-white border-2"
            />
          </div>
        )}
        {displayScore !== null && !selectionMode && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              {displayScore.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 truncate">
          {photo.filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, "")}
        </h3>
        {displayDescription && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{displayDescription}</p>
        )}
      </div>
    </Card>
  );
};

export default PhotoCard;
