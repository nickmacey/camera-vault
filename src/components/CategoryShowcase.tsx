import { Lock, TrendingUp, Archive, Sparkles, Gem, Star } from "lucide-react";
import { PhotoBackgroundCard } from "./PhotoBackgroundCard";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CategoryShowcase = () => {
  const { vaultWorthy, highValue, top10Photos } = useTop10Photos();
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  
  useEffect(() => {
    const fetchAllPhotos = async () => {
      const { data, count } = await supabase
        .from('photos')
        .select('*', { count: 'exact' })
        .order('overall_score', { ascending: false });
      
      setAllPhotos(data || []);
      setTotalPhotos(count || 0);
    };
    
    fetchAllPhotos();
  }, []);

  const vaultWorthyCount = vaultWorthy.length;
  const highValueCount = highValue.length;
  const archiveCount = totalPhotos - vaultWorthyCount - highValueCount;
  
  const vaultWorthyValue = vaultWorthyCount * 150;
  const highValueValue = highValueCount * 75;

  // Get archive photos
  const archivePhotos = allPhotos.filter(p => 
    p.tier !== 'vault-worthy' && p.tier !== 'high-value'
  );

  return (
    <section className="relative py-16 md:py-24 px-4 md:px-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground mb-4 tracking-tight">
            YOUR COLLECTION
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Every photo analyzed, categorized, and valued
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Elite (Vault Worthy) */}
          <PhotoBackgroundCard
            photoUrl={vaultWorthy[0]?.url}
            icon={Sparkles}
            title="ELITE"
            subtitle="Premium Portfolio"
            count={vaultWorthyCount}
            value={`$${vaultWorthyValue.toLocaleString()}`}
            description="Your most valuable assets. Portfolio-ready and market-tested."
            previewPhotos={vaultWorthy.slice(0, 12).map(p => p.url)}
            variant="vault-worthy"
          />
          
          {/* Stars (High Value) */}
          <PhotoBackgroundCard
            photoUrl={highValue[0]?.url}
            icon={Star}
            title="STARS"
            subtitle="Strong Contenders"
            count={highValueCount}
            value={`$${highValueValue.toLocaleString()}`}
            description="Exceptional work with elite potential. Refine and elevate."
            previewPhotos={highValue.slice(0, 12).map(p => p.url)}
            variant="high-value"
          />
          
          {/* Gems (Archive) */}
          <PhotoBackgroundCard
            photoUrl={archivePhotos[0]?.storage_path ? 
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${archivePhotos[0].storage_path}` : 
              undefined
            }
            icon={Gem}
            title="GEMS"
            subtitle="Discovery Zone"
            count={archiveCount}
            description="Explore and uncover diamonds in the rough waiting to shine."
            previewPhotos={archivePhotos.slice(0, 12).map(p => 
              `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${p.storage_path}`
            )}
            variant="archive"
          />
        </div>
      </div>
    </section>
  );
};
