import { Card } from "@/components/ui/card";
import { cleanDescription, cleanScore, generateNameFromDescription } from "@/lib/utils";

interface PhotoCardProps {
  photo: {
    id: string;
    url: string;
    filename: string;
    description?: string;
    score?: number;
    width?: number;
    height?: number;
  };
  onClick?: () => void;
}

const PhotoCard = ({ photo, onClick }: PhotoCardProps) => {
  const displayScore = cleanScore(photo.score, photo.description);
  const displayDescription = cleanDescription(photo.description);
  const displayName = generateNameFromDescription(photo.description, photo.filename);
  
  return (
    <Card 
      className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={photo.url}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {displayScore !== null && (
          <div className="absolute top-2 right-2">
            <div className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              {displayScore.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 truncate">
          {displayName}
        </h3>
        {displayDescription && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {displayDescription}
          </p>
        )}
      </div>
    </Card>
  );
};

export default PhotoCard;
