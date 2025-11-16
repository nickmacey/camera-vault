import { useQuery } from "@tanstack/react-query";
import { Lock, TrendingUp, Award, Star } from "lucide-react";
import { useTop10Photos } from "@/hooks/useTop10Photos";

const StatsBar = () => {
  const { top10Photos } = useTop10Photos();
  
  // Mock data - will be replaced with real API calls
  const stats = {
    total_photos: 0,
    avg_score: 0,
    top_score: 0,
    over_80: 0,
  };
  
  // Get a random top photo for background accent
  const accentPhoto = top10Photos.length > 0 
    ? top10Photos[Math.floor(Math.random() * Math.min(5, top10Photos.length))]
    : null;

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 relative overflow-hidden">
      {/* Subtle background accent from random top photo */}
      {accentPhoto && (
        <div className="absolute top-0 right-0 w-96 h-full opacity-5 pointer-events-none">
          <img 
            src={accentPhoto.url} 
            alt=""
            className="w-full h-full object-cover blur-3xl scale-110" 
          />
        </div>
      )}
      
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Lock className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-foreground">{stats.total_photos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Assets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-green/10 border border-vault-green/20">
              <TrendingUp className="h-5 w-5 text-vault-green" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-foreground">{stats.avg_score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Avg Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Star className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-gold">{stats.top_score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Peak Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Award className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-gold">{stats.over_80}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Vault Worthy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
