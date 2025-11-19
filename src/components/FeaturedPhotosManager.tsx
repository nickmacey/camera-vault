import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Star, MoveUp, MoveDown, Save, Trash2 } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

interface Photo {
  id: string;
  filename: string;
  storage_path: string;
  is_featured: boolean;
  featured_order: number | null;
  score: number | null;
}

export function FeaturedPhotosManager() {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [featuredPhotos, setFeaturedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('photos')
      .select('id, filename, storage_path, is_featured, featured_order, score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error loading photos",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    const all = data || [];
    const featured = all
      .filter(p => p.is_featured)
      .sort((a, b) => (a.featured_order || 999) - (b.featured_order || 999));

    setAllPhotos(all);
    setFeaturedPhotos(featured);
    setLoading(false);
  };

  const toggleFeatured = async (photoId: string, currentlyFeatured: boolean) => {
    if (currentlyFeatured) {
      // Remove from featured
      const { error } = await supabase
        .from('photos')
        .update({ is_featured: false, featured_order: null })
        .eq('id', photoId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      // Add to featured with next order number
      const nextOrder = featuredPhotos.length > 0 
        ? Math.max(...featuredPhotos.map(p => p.featured_order || 0)) + 1
        : 1;

      const { error } = await supabase
        .from('photos')
        .update({ is_featured: true, featured_order: nextOrder })
        .eq('id', photoId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({
      title: currentlyFeatured ? "Removed from carousel" : "Added to carousel",
      description: currentlyFeatured 
        ? "Photo will no longer appear in default carousel" 
        : "Photo will appear in default carousel for all users"
    });

    loadPhotos();
  };

  const movePhoto = async (photoId: string, direction: 'up' | 'down') => {
    const currentIndex = featuredPhotos.findIndex(p => p.id === photoId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === featuredPhotos.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...featuredPhotos];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    // Update order in database
    const updates = reordered.map((photo, index) => 
      supabase
        .from('photos')
        .update({ featured_order: index + 1 })
        .eq('id', photo.id)
    );

    await Promise.all(updates);
    loadPhotos();
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return <div className="text-center py-8">Loading photos...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Featured Photos Section */}
      <Card className="p-6 bg-gradient-to-br from-vault-dark-gray to-black border-vault-gold/40">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-vault-gold" />
          <div>
            <h2 className="text-2xl font-bold text-vault-platinum">
              Featured Carousel Photos
            </h2>
            <p className="text-sm text-vault-light-gray">
              These photos appear in the default carousel for all users before they upload their own
            </p>
          </div>
        </div>

        {featuredPhotos.length === 0 ? (
          <div className="text-center py-12 text-vault-light-gray">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No featured photos yet. Select photos below to add them to the carousel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative bg-vault-dark-gray rounded-lg overflow-hidden border-2 border-vault-gold/50"
              >
                <div className="absolute top-2 left-2 z-10 bg-vault-gold text-black px-2 py-1 rounded-md text-xs font-bold">
                  #{index + 1}
                </div>
                
                <OptimizedImage
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.filename}
                  className="w-full h-48 object-cover"
                />

                <div className="p-3 space-y-2">
                  <p className="text-xs text-vault-platinum truncate font-medium">
                    {photo.filename}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => movePhoto(photo.id, 'up')}
                      disabled={index === 0}
                      className="flex-1"
                    >
                      <MoveUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => movePhoto(photo.id, 'down')}
                      disabled={index === featuredPhotos.length - 1}
                      className="flex-1"
                    >
                      <MoveDown className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => toggleFeatured(photo.id, true)}
                      className="flex-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All Photos Section */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-vault-platinum mb-4">
          Your Photos - Click to Add to Carousel
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allPhotos
            .filter(p => !p.is_featured)
            .map(photo => (
              <button
                key={photo.id}
                onClick={() => toggleFeatured(photo.id, false)}
                className="group relative bg-vault-dark-gray rounded-lg overflow-hidden border border-vault-mid-gray hover:border-vault-gold transition-all"
              >
                <OptimizedImage
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.filename}
                  className="w-full h-32 object-cover"
                />
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Star className="w-8 h-8 text-vault-gold" />
                </div>

                <div className="p-2">
                  <p className="text-[10px] text-vault-light-gray truncate">
                    {photo.filename}
                  </p>
                  {photo.score && (
                    <p className="text-xs text-vault-gold font-bold">
                      {photo.score.toFixed(1)}
                    </p>
                  )}
                </div>
              </button>
            ))}
        </div>

        {allPhotos.filter(p => !p.is_featured).length === 0 && (
          <div className="text-center py-12 text-vault-light-gray">
            <p>All your photos are featured! Upload more photos to add to the carousel.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
