import { useQuery } from "@tanstack/react-query";
import { Lock, TrendingUp, Award, Star } from "lucide-react";

const StatsBar = () => {
  // Mock data - will be replaced with real API calls
  const stats = {
    total_photos: 0,
    avg_score: 0,
    top_score: 0,
    over_80: 0,
  };

  return (
    <div className="border-b border-vault-mid-gray bg-vault-dark-gray/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Lock className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-platinum">{stats.total_photos}</p>
              <p className="text-xs text-vault-light-gray uppercase tracking-wide">Total Assets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-green/10 border border-vault-green/20">
              <TrendingUp className="h-5 w-5 text-vault-green" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-platinum">{stats.avg_score.toFixed(1)}</p>
              <p className="text-xs text-vault-light-gray uppercase tracking-wide">Avg Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-gold/10 border border-vault-gold/20">
              <Star className="h-5 w-5 text-vault-gold" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-gold">{stats.top_score.toFixed(1)}</p>
              <p className="text-xs text-vault-light-gray uppercase tracking-wide">Top Score</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-vault-green/10 border border-vault-green/20">
              <Award className="h-5 w-5 text-vault-green" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-vault-green">{stats.over_80}</p>
              <p className="text-xs text-vault-light-gray uppercase tracking-wide">Vault Worthy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
