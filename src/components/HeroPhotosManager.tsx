import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Photo {
  id: string;
  filename: string;
  storage_path: string;
  thumbnail_path: string | null;
  is_hero: boolean;
  hero_order: number | null;
  score: number | null;
}

export function HeroPhotosManager() {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [heroPhotos, setHeroPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: photos, error } = await supabase
        .from('photos')
        .select('id, filename, storage_path, thumbnail_path, is_hero, hero_order, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const hero = photos?.filter(p => p.is_hero).sort((a, b) => (a.hero_order || 0) - (b.hero_order || 0)) || [];
      const nonHero = photos?.filter(p => !p.is_hero) || [];

      setHeroPhotos(hero);
      setAllPhotos(nonHero);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const toggleHero = async (photoId: string, currentlyHero: boolean) => {
    try {
      if (currentlyHero) {
        // Remove from hero
        await supabase
          .from('photos')
          .update({ is_hero: false, hero_order: null })
          .eq('id', photoId);
        toast.success('Removed from hero carousel');
      } else {
        // Add to hero (at the end)
        const maxOrder = Math.max(0, ...heroPhotos.map(p => p.hero_order || 0));
        await supabase
          .from('photos')
          .update({ is_hero: true, hero_order: maxOrder + 1 })
          .eq('id', photoId);
        toast.success('Added to hero carousel');
      }
      
      await loadPhotos();
    } catch (error) {
      console.error('Error toggling hero:', error);
      toast.error('Failed to update photo');
    }
  };

  const movePhoto = async (photoId: string, direction: 'up' | 'down') => {
    const index = heroPhotos.findIndex(p => p.id === photoId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === heroPhotos.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const swapPhoto = heroPhotos[newIndex];

    try {
      await supabase
        .from('photos')
        .update({ hero_order: index })
        .eq('id', swapPhoto.id);

      await supabase
        .from('photos')
        .update({ hero_order: newIndex })
        .eq('id', photoId);

      await loadPhotos();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder photos');
    }
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDeleteClick = (photo: Photo) => {
    setPhotoToDelete(photo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return;

    setDeleting(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photoToDelete.storage_path]);

      if (storageError) throw storageError;

      // Delete thumbnail if exists
      if (photoToDelete.thumbnail_path) {
        await supabase.storage
          .from('thumbnails')
          .remove([photoToDelete.thumbnail_path]);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoToDelete.id);

      if (dbError) throw dbError;

      toast.success('Photo deleted successfully');
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading photos...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Hero Carousel Photos ({heroPhotos.length})</h3>
        <p className="text-muted-foreground mb-4">
          Select up to 10 photos to display in your personal hero carousel
        </p>
        
        {heroPhotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No photos selected. Click on photos below to add them.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {heroPhotos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.filename}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => movePhoto(photo.id, 'up')}
                    disabled={index === 0}
                    className="bg-background/80"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => movePhoto(photo.id, 'down')}
                    disabled={index === heroPhotos.length - 1}
                    className="bg-background/80"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleHero(photo.id, true)}
                    className="bg-background/80"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(photo)}
                    className="bg-destructive/80 hover:bg-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Your Photos</h3>
        <p className="text-muted-foreground mb-4">
          Click on any photo to add it to your hero carousel
        </p>
        
        {allPhotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All your photos are in the hero carousel!
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group"
              >
                <button
                  onClick={() => toggleHero(photo.id, false)}
                  disabled={heroPhotos.length >= 10}
                  className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <img
                    src={getPhotoUrl(photo.storage_path)}
                    alt={photo.filename}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(photo);
                  }}
                  className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {photo.score && (
                  <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold">
                    {photo.score.toFixed(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{photoToDelete?.filename}" from your vault and storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
