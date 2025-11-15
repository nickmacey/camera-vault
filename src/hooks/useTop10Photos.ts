import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanDescription, cleanScore } from "@/lib/utils";

export interface AnalyzedPhoto {
  id: string;
  url: string;
  filename: string;
  description?: string;
  score: number;
  width?: number;
  height?: number;
  aspectRatio: number;
  colorTemperature?: 'warm' | 'cool' | 'neutral';
  visualComplexity?: number;
}

export const useTop10Photos = () => {
  const [top10Photos, setTop10Photos] = useState<AnalyzedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600);

          const finalScore = cleanScore(photo.score, photo.description) || 0;
          const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 1;

          return {
            id: photo.id,
            url: urlData?.signedUrl || '',
            filename: photo.filename,
            description: cleanDescription(photo.description),
            score: finalScore,
            width: photo.width,
            height: photo.height,
            aspectRatio,
            colorTemperature: getColorTemperature(finalScore),
            visualComplexity: Math.random() * 0.5 + 0.3, // Placeholder for now
          };
        })
      );

      setTop10Photos(photosWithUrls);
    } catch (error) {
      console.error("Failed to load top 10 photos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simple heuristic for color temperature based on score
  const getColorTemperature = (score: number): 'warm' | 'cool' | 'neutral' => {
    const hash = score * 100;
    if (hash % 3 === 0) return 'warm';
    if (hash % 3 === 1) return 'cool';
    return 'neutral';
  };

  const vaultWorthy = top10Photos.filter(p => p.score >= 8.5);
  const highValue = top10Photos.filter(p => p.score >= 7.0 && p.score < 8.5);

  return {
    top10Photos,
    vaultWorthy,
    highValue,
    loading,
    isAuthenticated,
    refetch: fetchTop10Photos,
  };
};
