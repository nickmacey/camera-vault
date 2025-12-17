import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  // Duplicate photos for seamless loop
  const duplicatedPhotos = [...photos, ...photos];

  return (
    <section className="w-full py-12 overflow-hidden">
      <div className="mb-8 px-6">
        <h3 className="font-display text-3xl text-foreground/60 tracking-[0.2em]">LANDSCAPES</h3>
      </div>
      
      <div className="relative w-full">
        <motion.div
          className="flex gap-4"
          animate={{
            x: [0, -50 * photos.length + "%"],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
        >
          {duplicatedPhotos.map((photo, index) => (
            <div
              key={`${photo.id}-${index}`}
              className="relative flex-shrink-0 w-[80vw] md:w-[60vw] lg:w-[50vw] aspect-[16/9] overflow-hidden"
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
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
