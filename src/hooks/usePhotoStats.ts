import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PhotoStats {
  total: number;
  vault_worthy: number;
  high_value: number;
  archive: number;
  top_10: number;
  favorites: number;
  avg_score: number;
  top_score: number;
}

export const usePhotoStats = () => {
  const [stats, setStats] = useState<PhotoStats>({
    total: 0,
    vault_worthy: 0,
    high_value: 0,
    archive: 0,
    top_10: 0,
    favorites: 0,
    avg_score: 0,
    top_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        await fetchStats();
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchStats();
      } else {
        setStats({
          total: 0,
          vault_worthy: 0,
          high_value: 0,
          archive: 0,
          top_10: 0,
          favorites: 0,
          avg_score: 0,
          top_score: 0,
        });
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: photos, error } = await supabase
        .from('photos')
        .select('overall_score, tier, is_top_10, is_favorite')
        .order('overall_score', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (photos) {
        const total = photos.length;
        const vault_worthy = photos.filter(p => p.tier === 'elite').length;
        const high_value = photos.filter(p => p.tier === 'stars').length;
        const archive = photos.filter(p => p.tier === 'archive' || !p.tier).length;
        const top_10 = photos.filter(p => p.is_top_10).length;
        const favorites = photos.filter(p => p.is_favorite).length;
        
        const scoresOnly = photos
          .map(p => p.overall_score)
          .filter((s): s is number => s !== null && s !== undefined);
        
        const avg_score = scoresOnly.length > 0
          ? scoresOnly.reduce((acc, s) => acc + s, 0) / scoresOnly.length
          : 0;
        
        const top_score = scoresOnly.length > 0 ? Math.max(...scoresOnly) : 0;

        setStats({
          total,
          vault_worthy,
          high_value,
          archive,
          top_10,
          favorites,
          avg_score,
          top_score,
        });
      }
    } catch (error) {
      console.error("Failed to fetch photo stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, isAuthenticated, refetch: fetchStats };
};
