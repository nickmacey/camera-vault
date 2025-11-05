import { Award, Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import ScoreBadge from "@/components/ScoreBadge";

const Top10Showcase = () => {
  // Mock data - will be replaced with real API data
  const top10Photos: any[] = [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-secondary" />;
    if (rank === 2 || rank === 3) return <Medal className="h-6 w-6 text-score-good" />;
    return <Award className="h-6 w-6 text-primary" />;
  };

  if (top10Photos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="inline-flex p-4 rounded-full bg-secondary/10 mb-4">
          <Trophy className="h-12 w-12 text-secondary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Top 10 Yet</h3>
        <p className="text-muted-foreground">
          Upload and analyze photos to see your best shots ranked here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 mb-4">
          <Trophy className="h-5 w-5 text-secondary" />
          <span className="font-semibold text-secondary">Top 10 Showcase</span>
        </div>
        <h2 className="text-3xl font-bold">Your Best Photos</h2>
        <p className="text-muted-foreground mt-2">
          Automatically curated based on AI analysis and scoring
        </p>
      </div>

      {/* Featured #1 */}
      {top10Photos[0] && (
        <Card className="overflow-hidden border-2 border-secondary shadow-2xl">
          <div className="relative aspect-video">
            <img
              src={top10Photos[0].thumbnail_path}
              alt={top10Photos[0].filename}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-8 w-8 text-secondary" />
                    <span className="text-2xl font-bold text-white">#1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {top10Photos[0].filename}
                  </h3>
                  <p className="text-white/80 line-clamp-2">
                    {top10Photos[0].ai_description}
                  </p>
                </div>
                <ScoreBadge score={top10Photos[0].final_score} size="lg" />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grid of 2-10 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {top10Photos.slice(1).map((photo, idx) => (
          <Card
            key={photo.id}
            className="group overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="relative aspect-square">
              <img
                src={photo.thumbnail_path}
                alt={photo.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <ScoreBadge score={photo.final_score} className="absolute top-3 right-3" />
              
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                {getRankIcon(photo.top10_rank)}
                <span className="font-bold text-white">#{photo.top10_rank}</span>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-semibold mb-1 truncate">{photo.filename}</h4>
              {photo.ai_description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {photo.ai_description}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Top10Showcase;
