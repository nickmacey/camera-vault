import { Lock, TrendingUp, Archive, Sparkles, Gem, Star } from "lucide-react";
import { PhotoBackgroundCard } from "./PhotoBackgroundCard";
import { usePhotoStats } from "@/hooks/usePhotoStats";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InspirationalQuote } from "./InspirationalQuote";

// Value streams per tier
const VALUE_STREAMS = {
  elite: { print: 1200, social: 800, stock: 800 },
  stars: { print: 350, social: 250, stock: 200 },
  archive: { print: 50, social: 50, stock: 50 },
};

const getTierTotal = (tier: 'elite' | 'stars' | 'archive') => {
  const streams = VALUE_STREAMS[tier];
  return streams.print + streams.social + streams.stock;
};

const getTierBreakdown = (count: number, tier: 'elite' | 'stars' | 'archive') => ({
  print: count * VALUE_STREAMS[tier].print,
  social: count * VALUE_STREAMS[tier].social,
  stock: count * VALUE_STREAMS[tier].stock,
});

export const CategoryShowcase = () => {
  const { stats } = usePhotoStats();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [vaultWorthyPhotos, setVaultWorthyPhotos] = useState<any[]>([]);
  const [highValuePhotos, setHighValuePhotos] = useState<any[]>([]);
  const [archivePhotosWithUrls, setArchivePhotosWithUrls] = useState<any[]>([]);
  
  const scrollToGallery = () => {
    const gallerySection = document.querySelector('[data-gallery-section]');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const openVaultPage = () => {
    navigate('/app/vault');
  };
  
  const openStarsPage = () => {
    navigate('/app/stars');
  };
  
  const openGemsPage = () => {
    navigate('/app/gems');
  };
  
  useEffect(() => {
    const fetchTierPhotos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's first name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();
      
      if (profile?.first_name) {
        setFirstName(profile.first_name);
      }

      // Fetch vault-worthy photos
      const { data: vaultData } = await supabase
        .from('photos')
        .select('*')
        .eq('tier', 'vault-worthy')
        .order('overall_score', { ascending: false, nullsFirst: false })
        .limit(12);

      const vaultWithUrls = await Promise.all(
        (vaultData || []).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600);
          
          return {
            ...photo,
            url: urlData?.signedUrl || ''
          };
        })
      );
      setVaultWorthyPhotos(vaultWithUrls);

      // Fetch high-value photos
      const { data: highData } = await supabase
        .from('photos')
        .select('*')
        .eq('tier', 'high-value')
        .order('overall_score', { ascending: false, nullsFirst: false })
        .limit(12);

      const highWithUrls = await Promise.all(
        (highData || []).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600);
          
          return {
            ...photo,
            url: urlData?.signedUrl || ''
          };
        })
      );
      setHighValuePhotos(highWithUrls);

      // Fetch archive photos
      const { data: archiveData } = await supabase
        .from('photos')
        .select('*')
        .or('tier.eq.archive,tier.is.null')
        .order('overall_score', { ascending: false, nullsFirst: false })
        .limit(12);

      const archiveWithUrls = await Promise.all(
        (archiveData || []).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600);
          
          return {
            ...photo,
            url: urlData?.signedUrl || ''
          };
        })
      );
      setArchivePhotosWithUrls(archiveWithUrls);
    };
    
    fetchTierPhotos();
  }, []);

  const vaultWorthyCount = stats.vaultWorthy;
  const highValueCount = stats.highValue;
  const archiveCount = stats.archive;
  
  const vaultWorthyValue = vaultWorthyCount * getTierTotal('elite');
  const highValueValue = highValueCount * getTierTotal('stars');
  const archiveValue = archiveCount * getTierTotal('archive');
  
  const vaultBreakdown = getTierBreakdown(vaultWorthyCount, 'elite');
  const starsBreakdown = getTierBreakdown(highValueCount, 'stars');
  const gemsBreakdown = getTierBreakdown(archiveCount, 'archive');

  return (
    <section className="relative py-12 md:py-24 px-3 sm:px-4 md:px-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-20">
          <h2 className="font-black text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-foreground mb-3 md:mb-4 tracking-tight px-2">
            {firstName ? `${firstName.toUpperCase()}'S COLLECTION` : 'YOUR COLLECTION'}
          </h2>
          <InspirationalQuote />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* VAULT (Vault Worthy) */}
          <PhotoBackgroundCard
            photoUrl={vaultWorthyPhotos[0]?.url}
            icon={Lock}
            title="VAULT"
            subtitle="Share • Print • Monetize"
            count={vaultWorthyCount}
            value={`$${vaultWorthyValue.toLocaleString()}`}
            valueBreakdown={vaultBreakdown}
            description="Your portfolio-ready assets. Print, share, and monetize."
            previewPhotos={vaultWorthyPhotos.slice(0, 12).map(p => p.url)}
            variant="vault-worthy"
            onClick={openVaultPage}
          />
          
          {/* Stars (High Value) */}
          <PhotoBackgroundCard
            photoUrl={highValuePhotos[0]?.url}
            icon={Star}
            title="STARS"
            subtitle="Refine with AI"
            count={highValueCount}
            value={`$${highValueValue.toLocaleString()}`}
            valueBreakdown={starsBreakdown}
            description="Exceptional work with elite potential. Refine and elevate."
            previewPhotos={highValuePhotos.slice(0, 12).map(p => p.url)}
            variant="high-value"
            onClick={openStarsPage}
          />
          
          {/* Gems (Archive) */}
          <PhotoBackgroundCard
            photoUrl={archivePhotosWithUrls[0]?.url}
            icon={Gem}
            title="GEMS"
            subtitle="Hidden Talent"
            count={archiveCount}
            value={`$${archiveValue.toLocaleString()}`}
            valueBreakdown={gemsBreakdown}
            description="Explore and uncover diamonds in the rough waiting to shine."
            previewPhotos={archivePhotosWithUrls.map(p => p.url).filter(Boolean)}
            variant="archive"
            onClick={openGemsPage}
          />
        </div>
      </div>
    </section>
  );
};
