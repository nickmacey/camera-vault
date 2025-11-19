import { Lock, TrendingUp, Award, Star, Sparkles, Archive } from "lucide-react";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { usePhotoStats } from "@/hooks/usePhotoStats";

const StatsBar = () => {
  const { top10Photos } = useTop10Photos();
  const { stats } = usePhotoStats();

  const displayStats = {
    total_photos: stats.total,
    avg_score: stats.avg_score,
    top_score: stats.top_score,
    vault_worthy: stats.vault_worthy,
    high_value: stats.high_value,
    archive: stats.archive,
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
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-mono font-bold text-foreground">{displayStats.total_photos}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-bold">Assets</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-vault-green/10 border border-vault-green/20">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-vault-green" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-mono font-bold text-foreground">{displayStats.avg_score.toFixed(1)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-bold">Avg Score</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-mono font-bold text-vault-gold">{displayStats.top_score.toFixed(1)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-bold">Peak Score</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-mono font-bold text-vault-gold">{displayStats.vault_worthy}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-bold whitespace-nowrap">Vault Worthy</p>
            </div>
          </div>
        </div>

        {/* Tier Distribution Bar */}
        {displayStats.total_photos > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span className="font-medium hidden sm:inline">Collection Distribution</span>
              <span className="font-medium sm:hidden">Distribution</span>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Sparkles className="h-3 w-3 text-vault-gold" />
                  <span className="font-mono text-[10px] sm:text-xs">{displayStats.vault_worthy}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Star className="h-3 w-3 text-vault-green" />
                  <span className="font-mono text-[10px] sm:text-xs">{displayStats.high_value}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Archive className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] sm:text-xs">{displayStats.archive}</span>
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
