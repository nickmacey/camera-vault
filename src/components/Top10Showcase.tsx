import { useState, useEffect } from "react";
import { Award, Trophy, Medal, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ScoreBadge from "@/components/ScoreBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
import { cleanDescription, cleanScore } from "@/lib/utils";

const Top10Showcase = () => {
  const [top10Photos, setTop10Photos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchTop10Photos();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchTop10Photos();
      } else {
        setTop10Photos([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTop10Photos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get signed URLs for photos
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo, index) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600);

          return {
            ...photo,
            url: urlData?.signedUrl,
            top10_rank: index + 1,
            final_score: cleanScore(photo.score, photo.description) || 0,
            ai_description: cleanDescription(photo.description)
          };
        })
      );

      setTop10Photos(photosWithUrls);
    } catch (error: any) {
      toast.error(error.message || "Failed to load top 10 photos");
    } finally {
      setLoading(false);
    }
  };

  const downloadTop10AsZip = async () => {
    if (top10Photos.length === 0) {
      toast.error("No photos to download");
      return;
    }

    try {
      setDownloading(true);
      toast.info("Preparing your top 10 photos for download...");

      const zip = new JSZip();
      const photoFolder = zip.folder("top-10-photos");

      // Fetch and add each photo to the ZIP
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

      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `top-10-photos-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Top 10 photos downloaded successfully!");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download photos. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-secondary" />;
    if (rank === 2 || rank === 3) return <Medal className="h-6 w-6 text-score-good" />;
    return <Award className="h-6 w-6 text-primary" />;
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="inline-flex p-4 rounded-full bg-secondary/10 mb-4">
          <Trophy className="h-12 w-12 text-secondary animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Loading Top 10...</h3>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-12 text-center">
        <div className="inline-flex p-4 rounded-full bg-secondary/10 mb-4">
          <Trophy className="h-12 w-12 text-secondary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
        <p className="text-muted-foreground">
          Please sign in to view your top 10 photos
        </p>
      </Card>
    );
  }

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
        <Button 
          onClick={downloadTop10AsZip}
          disabled={downloading}
          className="mt-4"
          size="lg"
        >
          <Download className="h-5 w-5 mr-2" />
          {downloading ? "Preparing Download..." : "Download Top 10 as ZIP"}
        </Button>
      </div>

      {/* Featured #1 */}
      {top10Photos[0] && (
        <Card className="overflow-hidden border-2 border-secondary shadow-2xl">
          <div className="relative aspect-video">
            <img
              src={top10Photos[0].url}
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
                src={photo.url}
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
