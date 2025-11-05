import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Grid, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhotoCard from "./PhotoCard";
import { Lightbox } from "./Lightbox";

const PhotoGallery = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("score-desc");
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchPhotos();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchPhotos();
      } else {
        setPhotos([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [filterStatus, sortBy, isAuthenticated]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('photos')
        .select('*');

      // Apply filters
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply sorting
      const [field, direction] = sortBy.split('-');
      query = query.order(field, { ascending: direction === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      // Get signed URLs for photos
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600);

          return {
            ...photo,
            url: urlData?.signedUrl
          };
        })
      );

      setPhotos(photosWithUrls);
    } catch (error: any) {
      toast.error(error.message || "Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Photos</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-desc">Score: High to Low</SelectItem>
                <SelectItem value="score-asc">Score: Low to High</SelectItem>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center">
          <div className="animate-pulse text-muted-foreground">Loading photos...</div>
        </Card>
      ) : !isAuthenticated ? (
        <Card className="p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
            <Grid className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sign in to View Your Photos</h3>
          <p className="text-muted-foreground mb-4">
            Create an account or log in to upload and manage your photo collection
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In / Sign Up
          </Button>
        </Card>
      ) : photos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
            <Grid className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Photos Yet</h3>
          <p className="text-muted-foreground">
            Upload your first photos to get started with AI-powered analysis
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <PhotoCard 
              key={photo.id} 
              photo={photo}
              onClick={() => setLightboxPhoto(photo)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={photos}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={(direction) => {
            const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id);
            if (direction === "prev" && currentIndex > 0) {
              setLightboxPhoto(photos[currentIndex - 1]);
            } else if (direction === "next" && currentIndex < photos.length - 1) {
              setLightboxPhoto(photos[currentIndex + 1]);
            }
          }}
        />
      )}
    </div>
  );
};

export default PhotoGallery;
