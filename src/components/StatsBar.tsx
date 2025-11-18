import { useQuery } from "@tanstack/react-query";
import { Lock, TrendingUp, Award, Star, Sparkles, Archive } from "lucide-react";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { supabase } from "@/integrations/supabase/client";

const StatsBar = () => {
  const { top10Photos } = useTop10Photos();
  
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { 
        total_photos: 0, 
        avg_score: 0, 
        top_score: 0, 
        vault_worthy: 0,
        high_value: 0,
        archive: 0
      };

      const { data: photos } = await supabase
        .from("photos")
        .select("overall_score, tier")
        .eq("user_id", user.id);

      if (!photos || photos.length === 0) {
        return { 
          total_photos: 0, 
          avg_score: 0, 
          top_score: 0, 
          vault_worthy: 0,
          high_value: 0,
          archive: 0
        };
      }

      const scores = photos.map(p => p.overall_score || 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const max = Math.max(...scores);
      
      // Count by tier
      const vaultWorthy = photos.filter(p => p.tier === 'vault-worthy' || (p.overall_score || 0) >= 8.0).length;
      const highValue = photos.filter(p => p.tier === 'high-value' || ((p.overall_score || 0) >= 7.0 && (p.overall_score || 0) < 8.0)).length;
      const archive = photos.filter(p => p.tier === 'archive' || (p.overall_score || 0) < 7.0).length;

      return {
        total_photos: photos.length,
        avg_score: avg,
        top_score: max,
        vault_worthy: vaultWorthy,
        high_value: highValue,
        archive: archive,
      };
    },
  });

  const displayStats = stats || { 
    total_photos: 0, 
    avg_score: 0, 
    top_score: 0, 
    vault_worthy: 0,
    high_value: 0,
    archive: 0
  };
  
  // Get a random top photo for background accent
  const accentPhoto = top10Photos.length > 0 
    ? top10Photos[Math.floor(Math.random() * Math.min(5, top10Photos.length))]
    : null;

  // Calculate percentages for visual distribution
  const vaultPercent = displayStats.total_photos > 0 
    ? (displayStats.vault_worthy / displayStats.total_photos) * 100 
    : 0;
  const highValuePercent = displayStats.total_photos > 0 
    ? (displayStats.high_value / displayStats.total_photos) * 100 
    : 0;
  const archivePercent = displayStats.total_photos > 0 
    ? (displayStats.archive / displayStats.total_photos) * 100 
    : 0;

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Lock className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-foreground">{displayStats.total_photos}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Assets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-green/10 border border-vault-green/20">
              <TrendingUp className="h-5 w-5 text-vault-green" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-foreground">{displayStats.avg_score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Avg Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Star className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-gold">{displayStats.top_score.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Peak Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Award className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-gold">{displayStats.vault_worthy}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold">Vault Worthy</p>
            </div>
          </div>
        </div>

        {/* Tier Distribution Bar */}
        {displayStats.total_photos > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Collection Distribution</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-vault-gold" />
                  <span className="font-mono">{displayStats.vault_worthy}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-vault-green" />
                  <span className="font-mono">{displayStats.high_value}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Archive className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono">{displayStats.archive}</span>
                </div>
              </div>
            </div>
            <div className="h-2 w-full bg-vault-dark-gray rounded-full overflow-hidden flex">
              {/* Vault Worthy segment */}
              {vaultPercent > 0 && (
                <div 
                  className="bg-gradient-to-r from-vault-gold to-vault-gold-dark transition-all duration-500 relative group"
                  style={{ width: `${vaultPercent}%` }}
                  title={`Elite: ${displayStats.vault_worthy} (${vaultPercent.toFixed(1)}%)`}
                >
                  <div className="absolute inset-0 bg-vault-gold/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              
              {/* High Value segment */}
              {highValuePercent > 0 && (
                <div 
                  className="bg-gradient-to-r from-vault-green to-vault-green/80 transition-all duration-500 relative group"
                  style={{ width: `${highValuePercent}%` }}
                  title={`Stars: ${displayStats.high_value} (${highValuePercent.toFixed(1)}%)`}
                >
                  <div className="absolute inset-0 bg-vault-green/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              
              {/* Archive segment */}
              {archivePercent > 0 && (
                <div 
                  className="bg-muted/40 transition-all duration-500 relative group"
                  style={{ width: `${archivePercent}%` }}
                  title={`Gems: ${displayStats.archive} (${archivePercent.toFixed(1)}%)`}
                >
                  <div className="absolute inset-0 bg-muted/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsBar;
