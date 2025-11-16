import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VaultAnalysis } from "./VaultAnalysis";
import { VaultGallery } from "./VaultGallery";
import { VaultPortals } from "./VaultPortals";

type SanctuaryMode = "pedestal" | "analyzing" | "gallery" | "portals";

interface AnalyzingPhoto {
  file: File;
  url: string;
}

export const VaultSanctuary = () => {
  const [mode, setMode] = useState<SanctuaryMode>("pedestal");
  const [analyzingPhoto, setAnalyzingPhoto] = useState<AnalyzingPhoto | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<any | null>(null);

  useEffect(() => {
    // Voice greeting
    setTimeout(() => {
      // You could implement text-to-speech here
      toast.info("Welcome to your sanctuary. This is where hidden brilliance becomes visible.");
    }, 1000);

    fetchGalleryPhotos();
  }, []);

  const fetchGalleryPhotos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: photos } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", session.user.id)
      .gte("score", 8.5)
      .order("score", { ascending: false });

    if (photos) {
      const photosWithUrls = await Promise.all(
        photos.map(async (photo) => {
          const { data } = await supabase.storage
            .from("photos")
            .createSignedUrl(photo.storage_path, 3600);
          return { ...photo, url: data?.signedUrl };
        })
      );
      setGalleryPhotos(photosWithUrls);
      
      if (photosWithUrls.length > 0) {
        setMode("gallery");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAnalyzingPhoto({ file, url });
    setMode("analyzing");
  };

  const handleAnalysisComplete = (result: any) => {
    setAnalyzingPhoto(null);
    fetchGalleryPhotos();
    setMode("gallery");
  };

  const handleEnhance = () => {
    toast.info("Enhancement features coming soon");
  };

  const handleProtect = () => {
    toast.info("Protection features coming soon");
  };

  const handleDeploy = () => {
    setMode("portals");
  };

  return (
    <div className="relative min-h-screen w-full bg-vault-black overflow-hidden">
      {/* Marble floor effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-vault-dark-gray/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-vault-gold/30 to-transparent" />

      {/* Infinite darkness walls */}
      <div className="absolute inset-0 bg-gradient-radial from-vault-dark-gray/20 via-vault-black to-vault-black" />

      <AnimatePresence mode="wait">
        {mode === "pedestal" && (
          <motion.div
            key="pedestal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen"
          >
            {/* Floating pedestal */}
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative w-64 h-64 mb-8">
                {/* Pedestal base */}
                <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-vault-dark-gray to-vault-mid-gray rounded-lg shadow-2xl" />
                
                {/* Upload circle */}
                <label className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full border-4 border-vault-gold border-dashed flex items-center justify-center cursor-pointer hover:bg-vault-gold/10 transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-vault-gold mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-vault-gold text-sm">Drop photo here</p>
                  </div>
                </label>

                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-vault-gold/20 blur-3xl animate-pulse" />
              </div>

              <p className="text-white text-xl font-light text-center max-w-md">
                "Welcome to your sanctuary.<br />
                This is where hidden brilliance becomes visible.<br />
                Upload your first memory."
              </p>
            </motion.div>
          </motion.div>
        )}

        {mode === "analyzing" && analyzingPhoto && (
          <VaultAnalysis
            photo={analyzingPhoto}
            onComplete={handleAnalysisComplete}
          />
        )}

        {mode === "gallery" && (
          <VaultGallery
            photos={galleryPhotos}
            onPhotoSelect={setSelectedGalleryPhoto}
            onEnhance={handleEnhance}
            onProtect={handleProtect}
            onDeploy={handleDeploy}
            onUploadMore={() => setMode("pedestal")}
          />
        )}

        {mode === "portals" && (
          <VaultPortals
            selectedPhoto={selectedGalleryPhoto}
            onBack={() => setMode("gallery")}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
