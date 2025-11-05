import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Calendar, Award } from "lucide-react";
import ScoreBadge from "@/components/ScoreBadge";

interface PhotoCardProps {
  photo: any;
  viewMode: "grid" | "list";
}

const PhotoCard = ({ photo, viewMode }: PhotoCardProps) => {
  if (viewMode === "list") {
    return (
      <Card className="p-4 hover:shadow-lg transition-all duration-300">
        <div className="flex gap-4">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={photo.thumbnail_path}
              alt={photo.filename}
              className="w-full h-full object-cover"
            />
            <ScoreBadge score={photo.final_score} className="absolute top-2 right-2" />
          </div>

          <div className="flex-1">
            <h4 className="font-semibold mb-2">{photo.filename}</h4>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {photo.ai_description}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                {photo.width} × {photo.height}
              </div>
              {photo.capture_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(photo.capture_date).toLocaleDateString()}
                </div>
              )}
              {photo.is_top10 && (
                <div className="flex items-center gap-1 text-secondary">
                  <Award className="h-4 w-4" />
                  Top 10 #{photo.top10_rank}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 animate-scale-in">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={photo.thumbnail_path}
          alt={photo.filename}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <ScoreBadge score={photo.final_score} className="absolute top-3 right-3" />
        
        {photo.is_top10 && (
          <Badge className="absolute top-3 left-3 bg-secondary gap-1">
            <Award className="h-3 w-3" />
            Top {photo.top10_rank}
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-semibold mb-1 truncate">{photo.filename}</h4>
        
        {photo.ai_description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {photo.ai_description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {photo.width} × {photo.height}
          </div>
          {photo.capture_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(photo.capture_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PhotoCard;
