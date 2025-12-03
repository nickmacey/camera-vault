import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Photo {
  id: string;
  url: string;
  filename: string;
  score: number | null;
}

const quotes = [
  "If you're not failing every now and again, it's a sign you're not doing anything very innovative.",
  "The creative process is a process of surrender, not control.",
  "Creativity is allowing yourself to make mistakes. Art is knowing which ones to keep.",
  "Don't think about making art, just get it done.",
  "The only way to do great work is to love what you do.",
  "Photography is the story I fail to put into words.",
  "Your photography is a record of your living, for anyone who really sees.",
  "The camera is an instrument that teaches people how to see without a camera.",
  "Every moment is a fresh beginning.",
  "Life is what happens when you're busy making other plans.",
  "In the middle of difficulty lies opportunity.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
];

const presets = {
  bw: "grayscale(100%) contrast(1.1)",
  color: "saturate(1.3) contrast(1.05) brightness(1.02)",
  film: "sepia(0.35) contrast(0.95) brightness(1.05) saturate(0.9)",
};

export default function HighlightReelPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchBestPhotos();
  }, []);

  const fetchBestPhotos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("photos")
        .select("id, filename, storage_path, overall_score, score")
        .eq("user_id", session.user.id)
        .order("overall_score", { ascending: false, nullsFirst: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        const photosWithUrls = await Promise.all(
          data.map(async (photo) => {
            const { data: urlData } = await supabase.storage
              .from("photos")
              .createSignedUrl(photo.storage_path, 3600);
            return {
              id: photo.id,
              url: urlData?.signedUrl || "",
              filename: photo.filename,
              score: photo.overall_score || photo.score,
            };
          })
        );
        setPhotos(photosWithUrls.filter((p) => p.url));
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Split photos into three groups for different presets
  const photoGroups = useMemo(() => {
    const bwPhotos = photos.slice(0, 10);
    const colorPhotos = photos.slice(10, 20);
    const filmPhotos = photos.slice(20, 30);
    return { bw: bwPhotos, color: colorPhotos, film: filmPhotos };
  }, [photos]);

  // Concatenate quotes for seamless scroll
  const marqueeText = quotes.join(" • ");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-vault-gold text-xl">Loading your story...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-background to-transparent">
        <h1 className="text-lg font-light tracking-widest text-foreground/80">MY STORY</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app")}
          className="text-vault-gold hover:text-vault-gold/80 group"
        >
          Enter Vault <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </header>

      {/* Pause/Play control */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors"
      >
        {isPaused ? <Play className="h-5 w-5 text-vault-gold" /> : <Pause className="h-5 w-5 text-vault-gold" />}
      </button>

      {/* Rolling Marquee Text - Center */}
      <div className="fixed top-1/2 left-0 right-0 -translate-y-1/2 z-40 pointer-events-none overflow-hidden">
        <motion.div
          className="whitespace-nowrap"
          animate={isPaused ? {} : { x: [0, -2000] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
        >
          <span className="text-[8vw] md:text-[6vw] font-bold text-white/90 tracking-tight" style={{ textShadow: "0 0 60px rgba(0,0,0,0.8)" }}>
            {marqueeText} • {marqueeText}
          </span>
        </motion.div>
      </div>

      {/* Photo Grid Sections */}
      <div className="relative">
        {/* B&W Section */}
        <section className="min-h-screen relative py-20">
          <PhotoGrid photos={photoGroups.bw} preset="bw" isPaused={isPaused} />
        </section>

        {/* Color Section */}
        <section className="min-h-screen relative py-20">
          <PhotoGrid photos={photoGroups.color} preset="color" isPaused={isPaused} />
        </section>

        {/* Film Section */}
        <section className="min-h-screen relative py-20">
          <PhotoGrid photos={photoGroups.film} preset="film" isPaused={isPaused} />
        </section>
      </div>

      {/* Footer CTA */}
      <footer className="relative z-30 py-20 flex flex-col items-center justify-center gap-6 bg-gradient-to-t from-background via-background to-transparent">
        <p className="text-muted-foreground text-sm tracking-widest uppercase">Your Photos. Your Fortune.</p>
        <Button
          size="lg"
          onClick={() => navigate("/app")}
          className="bg-vault-gold text-vault-dark hover:bg-vault-gold/90 px-8"
        >
          Continue to Vault
        </Button>
      </footer>
    </div>
  );
}

interface PhotoGridProps {
  photos: Photo[];
  preset: keyof typeof presets;
  isPaused: boolean;
}

function PhotoGrid({ photos, preset, isPaused }: PhotoGridProps) {
  const filter = presets[preset];
  
  // Create varied positions for artistic scatter layout
  const positions = useMemo(() => {
    return photos.map((_, i) => ({
      x: Math.random() * 80 + 5, // 5-85% from left
      y: Math.random() * 70 + 10, // 10-80% from top
      scale: 0.6 + Math.random() * 0.8, // 0.6-1.4 scale
      rotation: (Math.random() - 0.5) * 10, // -5 to 5 degrees
      delay: i * 0.1,
      duration: 15 + Math.random() * 10, // 15-25s float duration
    }));
  }, [photos.length]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        {photos.map((photo, index) => {
          const pos = positions[index];
          if (!pos) return null;
          
          return (
            <motion.div
              key={photo.id}
              className="absolute"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `scale(${pos.scale}) rotate(${pos.rotation}deg)`,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={
                isPaused
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      y: [0, -30, 0, 20, 0],
                      x: [0, 15, -10, 5, 0],
                    }
              }
              transition={{
                opacity: { duration: 0.8, delay: pos.delay },
                y: { duration: pos.duration, repeat: Infinity, ease: "easeInOut" },
                x: { duration: pos.duration * 1.2, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <div
                className="w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 overflow-hidden shadow-2xl"
                style={{ filter }}
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
