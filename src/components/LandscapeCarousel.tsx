import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { motion } from "framer-motion";

interface LandscapePhoto {
  id: string;
  url: string;
  filename: string;
  score: number | null;
  width: number | null;
  height: number | null;
}

export function LandscapeCarousel() {
  const [photos, setPhotos] = useState<LandscapePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandscapePhotos();
  }, []);

  const fetchLandscapePhotos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch photos with dimensions, ordered by score
      const { data, error } = await supabase
        .from("photos")
        .select("id, filename, storage_path, overall_score, score, width, height")
        .eq("user_id", session.user.id)
        .not("width", "is", null)
        .not("height", "is", null)
        .order("overall_score", { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Filter for landscape photos (width > height)
        const landscapePhotos = data.filter(p => 
          p.width && p.height && p.width > p.height
        );

        // Get signed URLs for landscape photos
        const photosWithUrls = await Promise.all(
          landscapePhotos.slice(0, 15).map(async (photo) => {
            const { data: urlData } = await supabase.storage
              .from("photos")
              .createSignedUrl(photo.storage_path, 7200);
            
            return {
              id: photo.id,
              url: urlData?.signedUrl || "",
              filename: photo.filename,
              score: photo.overall_score || photo.score,
              width: photo.width,
              height: photo.height,
            };
          })
        );

        setPhotos(photosWithUrls.filter(p => p.url));
      }
    } catch (error) {
      console.error("Error fetching landscape photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[50vh] bg-card/30 animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground tracking-widest">LOADING LANDSCAPES...</span>
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12">
      <div className="mb-8 px-6">
        <h2 className="font-display text-4xl md:text-5xl text-vault-gold tracking-wider">
          BEST LANDSCAPES
        </h2>
        <p className="text-muted-foreground mt-2 tracking-wide">Your top scenic captures</p>
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {photos.map((photo, index) => (
            <CarouselItem key={photo.id} className="pl-0 basis-full md:basis-4/5 lg:basis-3/4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="relative aspect-[16/9] w-full overflow-hidden"
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading={index < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <span className="text-foreground/70 text-sm tracking-wide truncate max-w-[60%]">
                    {photo.filename}
                  </span>
                  {photo.score && (
                    <span className="text-vault-gold font-display text-2xl">
                      {photo.score.toFixed(1)}
                    </span>
                  )}
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-background/80 border-vault-gold/30 text-vault-gold hover:bg-background hover:text-vault-gold" />
        <CarouselNext className="right-4 bg-background/80 border-vault-gold/30 text-vault-gold hover:bg-background hover:text-vault-gold" />
      </Carousel>
    </section>
  );
}
