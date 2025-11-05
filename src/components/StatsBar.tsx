import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, TrendingUp, Award, Star } from "lucide-react";
import { Card } from "@/components/ui/card";

const StatsBar = () => {
  // Mock data - will be replaced with real API calls
  const stats = {
    total_photos: 0,
    avg_score: 0,
    top_score: 0,
    over_80: 0,
  };

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total_photos}</p>
              <p className="text-xs text-muted-foreground">Total Photos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avg_score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-score-excellent/10">
              <Star className="h-5 w-5 text-score-excellent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.top_score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Top Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-score-good/10">
              <Award className="h-5 w-5 text-score-good" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.over_80}</p>
              <p className="text-xs text-muted-foreground">Score &gt; 80</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
