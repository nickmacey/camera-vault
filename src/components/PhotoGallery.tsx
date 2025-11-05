import { useState, useEffect } from "react";
import { Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhotoCard from "@/components/PhotoCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PhotoGallery = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("score-desc");
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
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
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
