import { Lock, TrendingUp, Archive } from "lucide-react";
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
    <section className="p-6 md:p-12">
      <div className="mb-8">
        <h2 className="font-black text-3xl md:text-4xl text-foreground mb-2">
          YOUR COLLECTION
        </h2>
        <p className="text-muted-foreground">
          Assets organized by market value and quality
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vault Worthy */}
        <PhotoBackgroundCard
          photoUrl={vaultWorthy[0]?.url}
          icon={Lock}
          title="VAULT WORTHY"
          count={vaultWorthyCount}
          value={`$${vaultWorthyValue.toLocaleString()}`}
          description="These are your money shots. Protected. Ready to sell."
          previewPhotos={vaultWorthy.slice(0, 12).map(p => p.url)}
          variant="vault-worthy"
        />
        
        {/* High Value */}
        <PhotoBackgroundCard
          photoUrl={highValue[0]?.url}
          icon={TrendingUp}
          title="HIGH VALUE"
          count={highValueCount}
          value={`$${highValueValue.toLocaleString()}`}
          description="Strong work. Could be refined into vault-worthy."
          previewPhotos={highValue.slice(0, 12).map(p => p.url)}
          variant="high-value"
        />
        
        {/* Archive */}
        <PhotoBackgroundCard
          photoUrl={archivePhotos[0]?.storage_path ? 
            `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${archivePhotos[0].storage_path}` : 
            undefined
          }
          icon={Archive}
          title="ARCHIVE"
          count={archiveCount}
          description="Not everything makes the cut. Review to unlock hidden gems."
          previewPhotos={archivePhotos.slice(0, 12).map(p => 
            `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${p.storage_path}`
          )}
          variant="archive"
        />
      </div>
    </section>
  );
};
