import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PhotoStats {
  total: number;
  vaultWorthy: number;
  highValue: number;
  archive: number;
  avgScore: number;
  peakScore: number;
  favorites: number;
}

export const usePhotoStats = () => {
  const [stats, setStats] = useState<PhotoStats>({
    total: 0,
    vaultWorthy: 0,
    highValue: 0,
    archive: 0,
    avgScore: 0,
    peakScore: 0,
    favorites: 0,
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
          vaultWorthy: 0,
          highValue: 0,
          archive: 0,
          avgScore: 0,
          peakScore: 0,
          favorites: 0,
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
        .select('score, is_favorite')
        .order('score', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (photos) {
        const total = photos.length;
        const vaultWorthy = photos.filter(p => (p.score || 0) >= 8).length;
        const highValue = photos.filter(p => (p.score || 0) >= 6.5 && (p.score || 0) < 8).length;
        const archive = photos.filter(p => (p.score || 0) < 6.5).length;
        const favorites = photos.filter(p => p.is_favorite).length;
        
        const scoresOnly = photos
          .map(p => p.score)
          .filter((s): s is number => s !== null && s !== undefined);
        
        const avgScore = scoresOnly.length > 0
          ? Number((scoresOnly.reduce((acc, s) => acc + s, 0) / scoresOnly.length).toFixed(1))
          : 0;
        
        const peakScore = scoresOnly.length > 0 
          ? Number(Math.max(...scoresOnly).toFixed(1)) 
          : 0;

        setStats({
          total,
          vaultWorthy,
          highValue,
          archive,
          avgScore,
          peakScore,
          favorites,
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
