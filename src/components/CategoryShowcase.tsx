import { Lock, TrendingUp, Archive } from "lucide-react";
import { PhotoBackgroundCard } from "./PhotoBackgroundCard";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CategoryShowcase = () => {
  const { vaultWorthy, highValue, top10Photos } = useTop10Photos();
  const [totalPhotos, setTotalPhotos] = useState(0);
  
  useEffect(() => {
    const fetchTotalPhotos = async () => {
      const { count } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true });
      setTotalPhotos(count || 0);
    };
    
    fetchTotalPhotos();
  }, []);

  const vaultWorthyCount = vaultWorthy.length;
  const highValueCount = highValue.length;
  const archiveCount = totalPhotos - vaultWorthyCount - highValueCount;
  
  const vaultWorthyValue = vaultWorthyCount * 150; // $150 per vault worthy photo estimate
  const highValueValue = highValueCount * 75; // $75 per high value photo estimate

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
          previewPhotos={vaultWorthy.slice(0, 3).map(p => p.url)}
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
          previewPhotos={highValue.slice(0, 3).map(p => p.url)}
          variant="high-value"
        />
        
        {/* Archive */}
        <PhotoBackgroundCard
          photoUrl={top10Photos[top10Photos.length - 1]?.url}
          icon={Archive}
          title="ARCHIVE"
          count={archiveCount}
          description="Not everything makes the cut. Review to unlock hidden gems."
          variant="archive"
        />
      </div>
    </section>
  );
};
