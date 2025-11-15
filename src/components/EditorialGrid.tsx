import { useState } from "react";
import { Lock, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { curateLayout } from "@/lib/photoLayout";
import ScoreBadge from "@/components/ScoreBadge";
import JSZip from "jszip";
import { toast } from "sonner";

export const EditorialGrid = () => {
  const { top10Photos, loading } = useTop10Photos();
  const [downloading, setDownloading] = useState(false);
  const layout = curateLayout(top10Photos);

  const downloadTop10AsZip = async () => {
    if (top10Photos.length === 0) {
      toast.error("No photos to download");
      return;
    }

    try {
      setDownloading(true);
      toast.info("Preparing vault elite collection...");

      const zip = new JSZip();
      const photoFolder = zip.folder("vault-elite");

      await Promise.all(
        top10Photos.map(async (photo, index) => {
          try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const extension = photo.filename.split('.').pop() || 'jpg';
            const filename = `${index + 1}-${photo.filename}`;
            photoFolder?.file(filename, blob);
          } catch (error) {
            console.error(`Failed to download ${photo.filename}:`, error);
          }
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vault-elite-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Vault elite collection downloaded");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <section className="p-6 md:p-12">
        <div className="text-center py-20">
          <div className="inline-block h-12 w-12 border-4 border-vault-gold border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-vault-light-gray">Curating your collection...</p>
        </div>
      </section>
    );
  }

  if (top10Photos.length === 0) {
    return (
      <section className="p-6 md:p-12">
        <div className="text-center py-20 max-w-4xl mx-auto">
          <h2 className="font-black text-4xl text-white mb-4">
            YOUR VAULT AWAITS
          </h2>
          <p className="text-vault-light-gray text-lg mb-12 leading-relaxed">
            Upload your photos to unlock their hidden value.<br />
            Here's how your best work could look:
          </p>
          
          {/* Example layout with placeholders */}
          <div className="grid grid-cols-12 gap-3 md:gap-4 auto-rows-[150px] opacity-30 mb-12">
            <div className="col-span-12 md:col-span-8 row-span-3 bg-vault-mid-gray rounded-lg" />
            <div className="col-span-6 md:col-span-4 row-span-2 bg-vault-mid-gray rounded-lg" />
            <div className="col-span-6 md:col-span-4 row-span-2 bg-vault-mid-gray rounded-lg" />
            <div className="col-span-4 row-span-2 bg-vault-mid-gray rounded-lg" />
            <div className="col-span-4 row-span-2 bg-vault-mid-gray rounded-lg" />
            <div className="col-span-4 row-span-2 bg-vault-mid-gray rounded-lg" />
          </div>
          
          <Button 
            size="lg"
            className="bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold px-12 py-6 text-lg"
          >
            Upload Your First Photos
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 md:p-12">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-black text-3xl md:text-4xl text-white mb-2">
            YOUR BEST WORK
          </h2>
          <p className="text-vault-light-gray">
            AI-curated collection of your highest-scoring assets
          </p>
        </div>
        <Button 
          onClick={downloadTop10AsZip}
          disabled={downloading}
          className="bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "Preparing..." : "Download Elite"}
        </Button>
      </div>
      
      {/* Editorial Grid */}
      <div className="grid grid-cols-12 gap-3 md:gap-4 auto-rows-[200px]">
        
        {/* Hero Photo (8 cols, 4 rows) */}
        {layout.hero && (
          <Card className="col-span-12 md:col-span-8 row-span-4 relative group overflow-hidden border-4 border-vault-gold shadow-[0_0_60px_rgba(212,175,55,0.4)] rounded-lg">
            <img 
              src={layout.hero.url}
              alt={layout.hero.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vault-black via-vault-black/40 to-transparent" />
            
            {layout.hero.score >= 8.5 && (
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-gradient-to-r from-vault-gold via-vault-gold-dark to-vault-gold text-vault-dark px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.6)] border-2 border-vault-gold font-bold text-sm">
                <Lock className="h-4 w-4" />
                VAULT WORTHY
              </div>
            )}
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs text-vault-gold uppercase mb-2 font-mono tracking-wider">
                    #1 TOP PERFORMER
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {layout.hero.filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')}
                  </h3>
                  {layout.hero.description && (
                    <p className="text-white/90 text-sm line-clamp-2 leading-relaxed max-w-2xl">
                      {layout.hero.description}
                    </p>
                  )}
                </div>
                <ScoreBadge score={layout.hero.score} size="lg" />
              </div>
            </div>
          </Card>
        )}
        
        {/* Secondary Photos (4 cols, 2 rows each) */}
        {layout.secondary.map((photo, idx) => (
          <Card 
            key={photo.id}
            className={`col-span-6 md:col-span-4 row-span-2 relative group overflow-hidden rounded-lg ${
              photo.score >= 8.5 
                ? 'border-2 border-vault-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]' 
                : 'border border-vault-mid-gray/20'
            }`}
          >
            <img 
              src={photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vault-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {photo.score >= 8.5 && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-vault-gold text-vault-dark px-2.5 py-1 rounded text-xs font-bold">
                <Lock className="h-3 w-3" />
                VAULT WORTHY
              </div>
            )}
            
            <ScoreBadge score={photo.score} className="absolute top-3 right-3" size="sm" />
            
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-xs text-vault-gold font-mono mb-1">#{idx + 2}</div>
              <div className="text-white font-semibold text-sm truncate">
                {photo.filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')}
              </div>
            </div>
          </Card>
        ))}
        
        {/* Tertiary Photos (4 cols, 2 rows each) */}
        {layout.tertiary.map((photo, idx) => (
          <Card 
            key={photo.id}
            className={`col-span-4 row-span-2 relative group overflow-hidden rounded-lg ${
              photo.score >= 8.5 
                ? 'border-2 border-vault-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                : 'border border-vault-mid-gray/20'
            }`}
          >
            <img 
              src={photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-vault-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="text-center">
                <div className="font-mono text-4xl font-bold text-vault-gold mb-2">
                  {photo.score.toFixed(1)}
                </div>
                <div className="text-xs text-white/80">
                  #{idx + 2 + layout.secondary.length}
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {/* Strip Photos (3 cols, 2 rows each) */}
        {layout.strip.map((photo, idx) => (
          <Card 
            key={photo.id}
            className="col-span-3 row-span-2 relative group overflow-hidden rounded-lg border border-vault-mid-gray/20"
          >
            <img 
              src={photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-2 right-2 bg-vault-black/80 text-vault-light-gray px-2 py-1 rounded text-xs font-mono">
              #{idx + 2 + layout.secondary.length + layout.tertiary.length}
            </div>
            <div className="absolute inset-0 bg-vault-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ScoreBadge score={photo.score} size="sm" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
