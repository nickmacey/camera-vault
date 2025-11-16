import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import ScoreBadge from "./ScoreBadge";

interface VaultAnalysisProps {
  photo: {
    file: File;
    url: string;
  };
  onComplete: (result: any) => void;
}

export const VaultAnalysis = ({ photo, onComplete }: VaultAnalysisProps) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"scanning" | "analyzing" | "scoring" | "complete">("scanning");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    analyzePhoto();
  }, []);

  const analyzePhoto = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to analyze photos");
        return;
      }

      // Stage 1: Scanning (visual effect)
      setStage("scanning");
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Get image dimensions
      const img = new Image();
      img.src = photo.url;
      await new Promise((resolve) => { img.onload = resolve; });
      const { width, height } = img;

      // Stage 2: AI Analysis
      setStage("analyzing");
      setProgress(0);

      const reader = new FileReader();
      reader.readAsDataURL(photo.file);
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      const { data: aiData, error: aiError } = await supabase.functions.invoke("analyze-photo", {
        body: { imageData: base64 },
      });

      if (aiError) throw aiError;

      setAnalysisData(aiData);
      
      for (let i = 0; i <= 100; i += 5) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Stage 3: Scoring
      setStage("scoring");
      setProgress(0);

      const finalScore = aiData.score || 7.5;
      
      // Animate score counting up
      for (let i = 0; i <= finalScore * 10; i++) {
        setScore(i / 10);
        setProgress((i / (finalScore * 10)) * 100);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Create thumbnail
      const thumbnailBlob = await imageCompression(photo.file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
      });

      // Upload to storage
      const timestamp = Date.now();
      const originalPath = `${session.user.id}/${timestamp}-${photo.file.name}`;
      const thumbnailPath = `${session.user.id}/${timestamp}-thumb-${photo.file.name}`;

      await supabase.storage.from("photos").upload(originalPath, photo.file);
      await supabase.storage.from("photos").upload(thumbnailPath, thumbnailBlob);

      // Save to database
      const { data: photoData } = await supabase.from("photos").insert({
        user_id: session.user.id,
        filename: photo.file.name,
        storage_path: originalPath,
        thumbnail_path: thumbnailPath,
        description: aiData.description,
        score: finalScore,
        width,
        height,
        status: "analyzed",
        is_top_10: finalScore >= 8.5,
      }).select().single();

      setStage("complete");
      
      // Play completion sound
      toast.success(finalScore >= 8.5 ? "VAULT WORTHY!" : "Photo analyzed successfully");

      setTimeout(() => {
        onComplete(photoData);
      }, 2000);

    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative z-10 flex items-center justify-center min-h-screen"
    >
      <div className="relative w-full max-w-4xl px-6">
        {/* Photo on pedestal */}
        <motion.div
          className="relative mx-auto mb-12"
          style={{ maxWidth: "600px" }}
        >
          <img
            src={photo.url}
            alt="Analyzing"
            className="w-full h-auto rounded-lg shadow-2xl"
          />

          {/* Laser scanning effect */}
          {stage === "scanning" && (
            <motion.div
              className="absolute inset-0 border-t-4 border-vault-gold"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Data visualizations */}
          {stage === "analyzing" && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Color spectrum */}
              <div className="absolute top-4 right-4 w-32 h-8 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded opacity-80" />
              
              {/* Composition grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-vault-gold/30">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-vault-gold/20" />
                ))}
              </div>

              {/* Scanning lines */}
              <motion.div
                className="absolute inset-x-0 h-px bg-vault-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          )}

          {/* Score display */}
          {stage === "scoring" && score !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-vault-gold/20 blur-3xl animate-pulse" />
                <div className="relative text-center">
                  <div className="text-8xl font-mono font-bold text-vault-gold mb-4 drop-shadow-[0_0_30px_rgba(212,175,55,0.8)]">
                    {score.toFixed(1)}
                  </div>
                  {score >= 8.5 && (
                    <div className="text-2xl font-bold text-vault-gold tracking-wider">
                      VAULT WORTHY
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Analysis stage indicator */}
        <div className="text-center">
          <p className="text-white text-2xl font-light mb-4">
            {stage === "scanning" && "Scanning image structure..."}
            {stage === "analyzing" && "AI analyzing composition..."}
            {stage === "scoring" && "Calculating final score..."}
            {stage === "complete" && "Analysis complete!"}
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto h-2 bg-vault-dark-gray rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-vault-gold to-vault-gold-dark"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Analysis details */}
          {analysisData && stage !== "scanning" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-vault-light-gray text-sm max-w-2xl mx-auto"
            >
              <p className="italic">{analysisData.description}</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
