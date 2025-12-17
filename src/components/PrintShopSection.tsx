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
  preset: string | null;
}

interface CategoryPhotos {
  bw: PrintPhoto[];
  color: PrintPhoto[];
  film: PrintPhoto[];
}

const PRINT_SIZES = [
  { name: '8×10"', price: 29 },
  { name: '11×14"', price: 49 },
  { name: '16×20"', price: 79 },
  { name: '24×36"', price: 129 },
];

const CATEGORY_LABELS = {
  bw: "BLACK & WHITE",
  color: "VIBRANT",
  film: "VINTAGE FILM",
};

const presets = {
  bw: "grayscale(100%) contrast(1.1)",
  color: "saturate(1.3) contrast(1.05) brightness(1.02)",
  film: "sepia(0.35) contrast(0.95) brightness(1.05) saturate(0.9)",
};

export function PrintShopSection() {
  const [categoryPhotos, setCategoryPhotos] = useState<CategoryPhotos>({ bw: [], color: [], film: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPrintablePhotos();
  }, []);

  const fetchPrintablePhotos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch high-scoring photos, excluding those with people
      const { data, error } = await supabase
        .from("photos")
        .select("id, filename, storage_path, overall_score, score, description, ai_analysis, highlight_reel_preset")
        .eq("user_id", session.user.id)
        .gte("overall_score", 7.0)
        .order("overall_score", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Filter out photos that mention people/faces/portraits
        const peopleKeywords = ['person', 'people', 'face', 'portrait', 'man', 'woman', 'child', 'boy', 'girl', 'human', 'selfie', 'crowd'];
        
        const filteredPhotos = data.filter(photo => {
          const textToCheck = `${photo.description || ''} ${photo.ai_analysis || ''}`.toLowerCase();
          return !peopleKeywords.some(keyword => textToCheck.includes(keyword));
        });

        // Track used photo IDs to prevent duplicates
        const usedIds = new Set<string>();
        
        type DbPhoto = typeof filteredPhotos[number];
        
        // Categorize photos - first by explicit preset, then distribute remaining
        const categories: { bw: DbPhoto[]; color: DbPhoto[]; film: DbPhoto[] } = { bw: [], color: [], film: [] };
        const uncategorized: DbPhoto[] = [];
        
        filteredPhotos.forEach(photo => {
          if (photo.highlight_reel_preset && ['bw', 'color', 'film'].includes(photo.highlight_reel_preset)) {
            const preset = photo.highlight_reel_preset as keyof typeof categories;
            if (categories[preset].length < 3 && !usedIds.has(photo.id)) {
              categories[preset].push(photo);
              usedIds.add(photo.id);
            }
          } else {
            uncategorized.push(photo);
          }
        });

        // Fill remaining slots with uncategorized photos
        const presetOrder: (keyof typeof categories)[] = ['bw', 'color', 'film'];
        for (const preset of presetOrder) {
          while (categories[preset].length < 3 && uncategorized.length > 0) {
            const photo = uncategorized.shift();
            if (photo && !usedIds.has(photo.id)) {
              categories[preset].push(photo);
              usedIds.add(photo.id);
            }
          }
        }

        // Get signed URLs for all photos
        const getUrlsForCategory = async (photos: DbPhoto[], preset: keyof CategoryPhotos) => {
          return Promise.all(
            photos.map(async (photo) => {
              const { data: urlData } = await supabase.storage
                .from("photos")
                .createSignedUrl(photo.storage_path, 7200);
              
              return {
                id: photo.id,
                url: urlData?.signedUrl || "",
                filename: photo.filename,
                score: photo.overall_score || photo.score,
                description: photo.description,
                preset,
              };
            })
          );
        };

        const [bwPhotos, colorPhotos, filmPhotos] = await Promise.all([
          getUrlsForCategory(categories.bw, 'bw'),
          getUrlsForCategory(categories.color, 'color'),
          getUrlsForCategory(categories.film, 'film'),
        ]);

        setCategoryPhotos({
          bw: bwPhotos.filter(p => p.url),
          color: colorPhotos.filter(p => p.url),
          film: filmPhotos.filter(p => p.url),
        });
      }
    } catch (error) {
      console.error("Error fetching printable photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPhotos = categoryPhotos.bw.length + categoryPhotos.color.length + categoryPhotos.film.length;

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

  if (totalPhotos === 0) {
    return null;
  }

  const renderCategoryRow = (photos: PrintPhoto[], category: keyof CategoryPhotos, index: number) => {
    if (photos.length === 0) return null;

    return (
      <div key={category} className="mb-16">
        {/* Category Label */}
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="font-display text-2xl md:text-3xl text-vault-gold/80 tracking-[0.2em] mb-8"
        >
          {CATEGORY_LABELS[category]}
        </motion.h3>

        {/* Photos Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {photos.map((photo, photoIndex) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index * 3 + photoIndex) * 0.1, duration: 0.5 }}
              className="group"
            >
              {/* Frame Container - Dark brown/almost black frame */}
              <div
                className={`relative p-4 md:p-6 rounded-sm shadow-2xl transition-all duration-500 cursor-pointer
                  ${selectedPhoto === photo.id 
                    ? 'ring-2 ring-vault-gold scale-[1.02]' 
                    : 'hover:scale-[1.02]'
                  }`}
                style={{
                  background: 'linear-gradient(135deg, hsl(20 15% 8%) 0%, hsl(20 20% 12%) 50%, hsl(20 15% 8%) 100%)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
                onClick={() => setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id)}
              >
                {/* Inner Mat */}
                <div className="bg-foreground/95 p-3 md:p-4 shadow-inner">
                  {/* Photo */}
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      style={{ filter: presets[category] }}
                      loading="lazy"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                      <Button size="sm" variant="secondary" className="gap-2">
                        <Frame className="w-4 h-4" />
                        Order Print
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 bg-background/20 border-foreground/30">
                        <Download className="w-4 h-4" />
                        Digital
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Info */}
              <div className="mt-4 text-center">
                <p className="font-display text-sm text-foreground/80 tracking-wider truncate">
                  {photo.filename.replace(/\.[^/.]+$/, "")}
                </p>
                {photo.score && (
                  <p className="text-xs text-vault-gold tracking-widest mt-1">
                    SCORE: {Number(photo.score).toFixed(1)}
                  </p>
                )}
              </div>

              {/* Size/Price Selection */}
              {selectedPhoto === photo.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-card/50 rounded-lg border border-border/30"
                >
                  <p className="text-xs text-muted-foreground tracking-wider mb-3">SELECT SIZE</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRINT_SIZES.map((size) => (
                      <Button
                        key={size.name}
                        variant="outline"
                        size="sm"
                        className="justify-between text-xs"
                      >
                        <span>{size.name}</span>
                        <span className="text-vault-gold">${size.price}</span>
                      </Button>
                    ))}
                  </div>
                  <Button className="w-full mt-3 gap-2 bg-vault-gold text-vault-dark hover:bg-vault-gold/90">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

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

        {/* Category Rows */}
        {renderCategoryRow(categoryPhotos.bw, 'bw', 0)}
        {renderCategoryRow(categoryPhotos.color, 'color', 1)}
        {renderCategoryRow(categoryPhotos.film, 'film', 2)}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-muted-foreground text-sm tracking-wider mb-4">
            All prints are professionally produced on archival-quality paper with museum-grade framing
          </p>
          <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground/60 tracking-widest">
            <span>FREE SHIPPING</span>
            <span>•</span>
            <span>100% SATISFACTION</span>
            <span>•</span>
            <span>SECURE CHECKOUT</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
