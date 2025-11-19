import { Lock, TrendingUp, Archive, Sparkles, Gem, Star } from "lucide-react";
import { PhotoBackgroundCard } from "./PhotoBackgroundCard";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CategoryShowcase = () => {
  const { vaultWorthy, highValue, top10Photos } = useTop10Photos();
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [archivePhotosWithUrls, setArchivePhotosWithUrls] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchAllPhotos = async () => {
      // Fetch ALL photos including those without scores
      const { data, count } = await supabase
        .from('photos')
        .select('*', { count: 'exact' })
        .order('overall_score', { ascending: false, nullsFirst: false });
      
      setAllPhotos(data || []);
      setTotalPhotos(count || 0);

      // Get archive photos (tier='archive' OR score < 7.0 OR no score yet)
      const archiveData = (data || []).filter(p => {
        const score = p.overall_score;
        return p.tier === 'archive' || score === null || score < 7.0;
      });

      // Generate signed URLs for archive photos
      const archiveWithUrls = await Promise.all(
        archiveData.slice(0, 12).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600);
          
          return {
            ...photo,
            url: urlData?.signedUrl || ''
          };
        })
      );

      setArchivePhotosWithUrls(archiveWithUrls);
    };
    
    fetchAllPhotos();
  }, []);

  const vaultWorthyCount = vaultWorthy.length;
  const highValueCount = highValue.length;
  
  // Calculate archive count - includes unscored photos
  const archiveCount = allPhotos.filter(p => {
    const score = p.overall_score;
    return p.tier === 'archive' || score === null || score < 7.0;
  }).length;
  
  const vaultWorthyValue = vaultWorthyCount * 150;
  const highValueValue = highValueCount * 75;
  const archiveValue = archiveCount * 25;

  return (
    <section className="relative py-12 md:py-24 px-3 sm:px-4 md:px-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-20">
          <h2 className="font-black text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-foreground mb-3 md:mb-4 tracking-tight px-2">
            YOUR COLLECTION
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-light max-w-2xl mx-auto px-4">
            Every photo analyzed, categorized, and valued
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Elite (Vault Worthy) */}
          <PhotoBackgroundCard
            photoUrl={vaultWorthy[0]?.url}
            icon={Sparkles}
            title="ELITE"
            subtitle="Ready to Share"
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
            subtitle="Refine with AI"
            count={highValueCount}
            value={`$${highValueValue.toLocaleString()}`}
            description="Exceptional work with elite potential. Refine and elevate."
            previewPhotos={highValue.slice(0, 12).map(p => p.url)}
            variant="high-value"
          />
          
          {/* Gems (Archive) */}
          <PhotoBackgroundCard
            photoUrl={archivePhotosWithUrls[0]?.url}
            icon={Gem}
            title="GEMS"
            subtitle="Hidden Talent"
            count={archiveCount}
            value={`$${archiveValue.toLocaleString()}`}
            description="Explore and uncover diamonds in the rough waiting to shine."
            previewPhotos={archivePhotosWithUrls.map(p => p.url).filter(Boolean)}
            variant="archive"
          />
        </div>
      </div>
    </section>
  );
};
