import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Pause, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HighlightReelManager } from "@/components/HighlightReelManager";
import { StoryLensSection } from "@/components/StoryLensSection";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  score: number | null;
  isVideo: boolean;
  mimeType: string | null;
  preset: string | null;
}


const presets = {
  bw: "grayscale(100%) contrast(1.1)",
  color: "saturate(1.3) contrast(1.05) brightness(1.02)",
  film: "sepia(0.35) contrast(0.95) brightness(1.05) saturate(0.9)",
};

export default function HighlightReelPage() {
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    fetchBestMedia();
    fetchLocations();
  }, []);
  // Convert DMS (degrees, minutes, seconds) array to decimal degrees
  const dmsToDecimal = (dms: number[] | number): number | null => {
    if (typeof dms === 'number') return dms;
    if (!Array.isArray(dms) || dms.length < 3) return null;
    const [degrees, minutes, seconds] = dms;
    return degrees + (minutes / 60) + (seconds / 3600);
  };

  const fetchLocations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: photos } = await supabase
        .from("photos")
        .select("location_data")
        .eq("user_id", session.user.id)
        .not("location_data", "is", null);

      if (photos && photos.length > 0) {
        // Extract coordinates from location_data
        const coordinates: { lat: number; lng: number }[] = [];
        
        photos.forEach((photo) => {
          const locData = photo.location_data as any;
          if (locData) {
            let lat: number | null = null;
            let lng: number | null = null;
            
            // Handle DMS array format: { latitude: [43, 26, 39.54], longitude: [6, 58, 39.78] }
            if (Array.isArray(locData.latitude)) {
              lat = dmsToDecimal(locData.latitude);
            } else if (typeof locData.latitude === 'number') {
              lat = locData.latitude;
            } else if (typeof locData.lat === 'number') {
              lat = locData.lat;
            }
            
            if (Array.isArray(locData.longitude)) {
              lng = dmsToDecimal(locData.longitude);
            } else if (typeof locData.longitude === 'number') {
              lng = locData.longitude;
            } else if (typeof locData.lng === 'number' || typeof locData.lon === 'number') {
              lng = locData.lng || locData.lon;
            }
            
            if (lat !== null && lng !== null) {
              coordinates.push({ lat, lng });
            }
          }
        });

        console.log('Found', coordinates.length, 'coordinates from', photos.length, 'photos with location data');

        if (coordinates.length > 0) {
          console.log('Sample coordinates:', coordinates.slice(0, 3));
          
          // Call reverse geocoding edge function
          const { data, error } = await supabase.functions.invoke('reverse-geocode', {
            body: { coordinates }
          });

          if (error) {
            console.error('Reverse geocoding error:', error);
          } else if (data?.locations && data.locations.length > 0) {
            console.log('Got locations:', data.locations);
            setLocations(data.locations);
          } else {
            console.log('No locations returned from geocoding');
          }
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchBestMedia = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // First try to get user-selected highlight reel items
      const { data: reelData, error: reelError } = await supabase
        .from("photos")
        .select("id, filename, storage_path, overall_score, score, mime_type, highlight_reel_preset")
        .eq("user_id", session.user.id)
        .eq("is_highlight_reel", true)
        .order("highlight_reel_order", { ascending: true });

      let dataToUse: typeof reelData = reelData;

      // If no custom selections, fall back to top-scored photos (doubled to 60)
      if (!reelData || reelData.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("photos")
          .select("id, filename, storage_path, overall_score, score, mime_type, highlight_reel_preset")
          .eq("user_id", session.user.id)
          .order("overall_score", { ascending: false, nullsFirst: false })
          .limit(60);

        if (fallbackError) throw fallbackError;
        dataToUse = fallbackData;
      } else if (reelError) {
        throw reelError;
      }

      if (dataToUse && dataToUse.length > 0) {
        // Remove duplicates by id
        const uniqueData = dataToUse.filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
        );
        
        const mediaWithUrls = await Promise.all(
          uniqueData.map(async (item) => {
            try {
              console.log("Creating signed URL for:", item.storage_path);
              const { data: urlData, error: urlError } = await supabase.storage
                .from("photos")
                .createSignedUrl(item.storage_path, 7200);
              
              if (urlError) {
                console.error("Signed URL error for", item.storage_path, ":", urlError);
                return null;
              }
              
              const signedUrl = urlData?.signedUrl;
              if (!signedUrl) {
                console.error("No signed URL returned for:", item.storage_path);
                return null;
              }
              
              console.log("Got signed URL for", item.filename, ":", signedUrl.substring(0, 100) + "...");
              
              const isVideo = item.mime_type?.startsWith("video/") || false;
              return {
                id: item.id,
                url: signedUrl,
                filename: item.filename,
                score: item.overall_score || item.score,
                isVideo,
                mimeType: item.mime_type,
                preset: item.highlight_reel_preset,
              };
            } catch (err) {
              console.error("Error processing media item:", item.id, err);
              return null;
            }
          })
        );
        
        const validMedia = mediaWithUrls.filter((m): m is MediaItem => m !== null && !!m.url);
        console.log("Total valid media items:", validMedia.length);
        setMedia(validMedia);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group media by preset, or split evenly if no presets assigned
  const mediaGroups = useMemo(() => {
    const hasCustomPresets = media.some(m => m.preset);
    
    if (hasCustomPresets) {
      return {
        bw: media.filter(m => m.preset === 'bw'),
        color: media.filter(m => m.preset === 'color' || !m.preset),
        film: media.filter(m => m.preset === 'film'),
      };
    }
    
    // Fallback: split evenly into 3 groups (20 each for 60 total)
    const bwMedia = media.slice(0, 20);
    const colorMedia = media.slice(20, 40);
    const filmMedia = media.slice(40, 60);
    return { bw: bwMedia, color: colorMedia, film: filmMedia };
  }, [media]);

  const handleManagerClose = () => {
    setManagerOpen(false);
    fetchBestMedia(); // Refresh after customization
  };

  // Create marquee text from locations
  const marqueeText = locations.length > 0 
    ? locations.join(" • ") 
    : "Your Journey • Your Memories • Your Story";

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
        <div className="flex items-center gap-2">
          <Sheet open={managerOpen} onOpenChange={setManagerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-foreground">
                <Settings2 className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Customize Your Story</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <HighlightReelManager />
              </div>
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app")}
            className="text-vault-gold hover:text-vault-gold/80 group"
          >
            Enter Vault <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
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

      {/* Story Lens Section - At the top */}
      <StoryLensSection />

      {/* Media Grid Sections */}
      <div className="relative">
        {/* B&W Section */}
        <section className="min-h-screen relative py-20">
          <MediaGrid items={mediaGroups.bw} preset="bw" isPaused={isPaused} />
        </section>

        {/* Color Section */}
        <section className="min-h-screen relative py-20">
          <MediaGrid items={mediaGroups.color} preset="color" isPaused={isPaused} />
        </section>

        {/* Film Section */}
        <section className="min-h-screen relative py-20">
          <MediaGrid items={mediaGroups.film} preset="film" isPaused={isPaused} />
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

interface MediaGridProps {
  items: MediaItem[];
  preset: keyof typeof presets;
  isPaused: boolean;
}

function MediaGrid({ items, preset, isPaused }: MediaGridProps) {
  const filter = presets[preset];
  
  // Create varied positions for artistic scatter layout - spread out with larger images
  const positions = useMemo(() => {
    return items.map((_, i) => ({
      x: (i % 3) * 30 + Math.random() * 15 + 5, // Spread across 3 columns with variation
      y: Math.floor(i / 3) * 40 + Math.random() * 20 + 10, // Spread vertically with variation
      scale: 0.9 + Math.random() * 0.2, // 0.9-1.1 scale
      rotation: (Math.random() - 0.5) * 6, // -3 to 3 degrees
      delay: i * 0.15,
      duration: 18 + Math.random() * 12, // 18-30s float duration
    }));
  }, [items.length]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        {items.map((item, index) => {
          const pos = positions[index];
          if (!pos) return null;
          
          return (
            <motion.div
              key={item.id}
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
                className="w-[70vw] h-[70vw] md:w-[55vw] md:h-[55vw] lg:w-[45vw] lg:h-[45vw] max-w-[800px] max-h-[800px] overflow-hidden shadow-2xl rounded-lg"
                style={{ filter }}
              >
                {item.isVideo ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ pointerEvents: "none" }}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error("Image failed to load:", item.url);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
