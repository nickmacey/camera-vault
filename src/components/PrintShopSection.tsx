import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Frame, Download } from "lucide-react";

interface PrintPhoto {
  id: string;
  url: string;
  filename: string;
  score: number | null;
  description: string | null;
}

const PRINT_SIZES = [
  { name: '8×10"', price: 29 },
  { name: '11×14"', price: 49 },
  { name: '16×20"', price: 79 },
  { name: '24×36"', price: 129 },
];

export function PrintShopSection() {
  const [photos, setPhotos] = useState<PrintPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPrintablePhotos();
  }, []);

  const fetchPrintablePhotos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch high-scoring photos, excluding those with people (based on description/AI analysis)
      const { data, error } = await supabase
        .from("photos")
        .select("id, filename, storage_path, overall_score, score, description, ai_analysis")
        .eq("user_id", session.user.id)
        .gte("overall_score", 7.0)
        .order("overall_score", { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data) {
        // Filter out photos that mention people/faces/portraits in description or analysis
        const peopleKeywords = ['person', 'people', 'face', 'portrait', 'man', 'woman', 'child', 'boy', 'girl', 'human', 'selfie', 'crowd'];
        
        const filteredPhotos = data.filter(photo => {
          const textToCheck = `${photo.description || ''} ${photo.ai_analysis || ''}`.toLowerCase();
          return !peopleKeywords.some(keyword => textToCheck.includes(keyword));
        });

        // Get signed URLs
        const photosWithUrls = await Promise.all(
          filteredPhotos.slice(0, 12).map(async (photo) => {
            const { data: urlData } = await supabase.storage
              .from("photos")
              .createSignedUrl(photo.storage_path, 7200);
            
            return {
              id: photo.id,
              url: urlData?.signedUrl || "",
              filename: photo.filename,
              score: photo.overall_score || photo.score,
              description: photo.description,
            };
          })
        );

        setPhotos(photosWithUrls.filter(p => p.url));
      }
    } catch (error) {
      console.error("Error fetching printable photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-20 bg-card/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse text-center text-muted-foreground tracking-widest">
            LOADING PRINT SHOP...
          </div>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-20 bg-gradient-to-b from-background via-card/30 to-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl text-vault-gold tracking-wider mb-4">
              PRINT SHOP
            </h2>
            <p className="text-muted-foreground text-lg tracking-wide max-w-2xl mx-auto">
              Turn your best work into stunning framed prints. Premium quality, delivered to your door.
            </p>
          </motion.div>
        </div>

        {/* Photo Grid - Framed Prints */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group"
            >
              {/* Frame Container */}
              <div 
                className={`relative p-4 bg-gradient-to-br from-amber-950/80 via-amber-900/60 to-amber-950/80 rounded-sm shadow-2xl cursor-pointer transition-all duration-300 ${
                  selectedPhoto === photo.id ? 'ring-2 ring-vault-gold scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                onClick={() => setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id)}
              >
                {/* Inner Frame Border */}
                <div className="p-2 bg-gradient-to-br from-amber-800/40 to-amber-900/40 rounded-sm">
                  {/* Mat/Mount */}
                  <div className="p-6 md:p-8 bg-foreground/95">
                    {/* Photo */}
                    <div className="relative aspect-[4/3] overflow-hidden shadow-inner">
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Frame Shadow */}
                <div className="absolute inset-0 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(255,255,255,0.1)] pointer-events-none" />
              </div>

              {/* Photo Info */}
              <div className="mt-4 text-center">
                <p className="text-foreground/80 text-sm tracking-wide truncate">
                  {photo.description || photo.filename}
                </p>
                {photo.score && (
                  <p className="text-vault-gold/70 text-xs mt-1 tracking-wider">
                    SCORE: {photo.score.toFixed(1)}
                  </p>
                )}
              </div>

              {/* Purchase Options (shown when selected) */}
              {selectedPhoto === photo.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-vault-gold/20"
                >
                  <p className="text-xs text-muted-foreground tracking-wider mb-3">SELECT SIZE</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {PRINT_SIZES.map((size) => (
                      <button
                        key={size.name}
                        className="px-3 py-2 text-sm bg-background/50 hover:bg-vault-gold/20 border border-border hover:border-vault-gold/50 rounded transition-colors tracking-wide"
                      >
                        {size.name} - ${size.price}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-vault-gold text-background hover:bg-vault-gold/90">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button size="sm" variant="outline" className="border-vault-gold/30 text-vault-gold hover:bg-vault-gold/10">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-card/50 backdrop-blur-sm rounded-full border border-vault-gold/20"
          >
            <Frame className="w-5 h-5 text-vault-gold" />
            <span className="text-foreground/80 tracking-wide">
              Free shipping on orders over $100
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
