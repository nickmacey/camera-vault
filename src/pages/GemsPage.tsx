import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Gem, Trash2, ArrowUp, ArrowDown, AlertTriangle, Sparkles, CheckSquare, Square, Loader2 } from "lucide-react";
import { useAutoAnalyze } from "@/hooks/useAutoAnalyze";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { formatCurrency, getPhotoValueByScore } from "@/lib/photoValue";
import { AIPhotoSearch } from "@/components/AIPhotoSearch";
import { FeatureNav } from "@/components/FeatureNav";

interface GemsPhoto {
  id: string;
  filename: string;
  storage_path: string;
  overall_score: number | null;
  description: string | null;
  analyzed_at?: string | null;
  url?: string;
}

const LOW_QUALITY_THRESHOLD = 5.5;

export default function GemsPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<GemsPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const removalSectionRef = useRef<HTMLDivElement>(null);

  // Auto-analyze callback
  const handlePhotoAnalyzed = useCallback((photoId: string, data: any) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, ...data } : p
    ));
  }, []);

  // Auto-analyze unscored photos
  const { analyzing, queueLength } = useAutoAnalyze(photos, handlePhotoAnalyzed);

  useEffect(() => {
    fetchGemsPhotos();
  }, []);

  const fetchGemsPhotos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('photos')
      .select('id, filename, storage_path, overall_score, description, analyzed_at')
      .eq('user_id', user.id)
      .or('tier.eq.archive,tier.is.null')
      .order('overall_score', { ascending: false, nullsFirst: false });

    if (error) {
      toast.error("Failed to load photos");
      return;
    }

    const photosWithUrls = await Promise.all(
      (data || []).map(async (photo) => {
        const { data: urlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 3600);
        return { ...photo, url: urlData?.signedUrl || '' };
      })
    );

    setPhotos(photosWithUrls);
    setLoading(false);
  };

  const totalValue = photos.reduce((sum, p) => sum + getPhotoValueByScore(p.overall_score), 0);
  
  // Separate photos into good ones and low-quality ones
  const goodPhotos = photos.filter(p => (p.overall_score || 0) >= LOW_QUALITY_THRESHOLD);
  const lowQualityPhotos = photos.filter(p => (p.overall_score || 0) < LOW_QUALITY_THRESHOLD);

  // Apply search filter
  const displayPhotos = searchResults 
    ? goodPhotos.filter(p => searchResults.includes(p.id))
    : goodPhotos;

  const scrollToRemoval = () => {
    removalSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelectPhoto = (photoId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const selectAllLowQuality = () => {
    const allLowQualityIds = lowQualityPhotos.map(p => p.id);
    setSelectedIds(new Set(allLowQualityIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeletePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${photo.filename}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await supabase.storage.from('photos').remove([photo.storage_path]);
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
      toast.success("Photo deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete photo");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.size} photos? This cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    const toastId = toast.loading(`Deleting ${selectedIds.size} photos...`);

    try {
      const photosToDelete = photos.filter(p => selectedIds.has(p.id));
      const storagePaths = photosToDelete.map(p => p.storage_path);

      await supabase.storage.from('photos').remove(storagePaths);

      const { error } = await supabase
        .from('photos')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      setPhotos(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      toast.success(`Deleted ${selectedIds.size} photos`, { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete photos", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePromoteToStars = async (photoId: string) => {
    // Optimistic update - remove from local state immediately
    const previousPhotos = [...photos];
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    
    const { error } = await supabase
      .from('photos')
      .update({ tier: 'high-value' })
      .eq('id', photoId);

    if (error) {
      // Revert on error
      setPhotos(previousPhotos);
      toast.error("Failed to promote photo");
      return;
    }

    toast.success("Photo promoted to Stars!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-gray-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-400 flex items-center gap-2">
                <Gem className="w-6 h-6" />
                GEMS
              </h1>
              <p className="text-sm text-muted-foreground">Hidden talent waiting to shine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-gray-400 border-gray-400">
              {photos.length} Photos • {formatCurrency(totalValue)}
            </Badge>
            {queueLength > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Analyzing {queueLength}
              </Badge>
            )}
            {lowQualityPhotos.length > 0 && (
              <Button variant="outline" size="sm" onClick={scrollToRemoval} className="text-orange-400 border-orange-400/50">
                <ArrowDown className="w-4 h-4 mr-2" />
                {lowQualityPhotos.length} to Review
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Feature Navigation */}
      <div className="py-4 border-b border-border bg-card/30">
        <FeatureNav />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* AI Search */}
        <div className="mb-6">
          <AIPhotoSearch
            photos={photos}
            onSearchResults={setSearchResults}
            tier="archive"
            placeholder="Search gems (e.g., 'beach photos', 'family moments', 'nature')"
          />
          {searchResults && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">
                Showing {displayPhotos.length} of {goodPhotos.length} photos
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)}>
                Clear search
              </Button>
            </div>
          )}
        </div>

        {/* Main Photo Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Gems ({displayPhotos.length})</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : displayPhotos.length === 0 ? (
            <div className="text-center py-20">
              <Gem className="w-16 h-16 mx-auto text-gray-400/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchResults ? "No matching photos" : "No Gems Yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchResults ? "Try a different search term" : "Upload photos to discover hidden gems"}
              </p>
              {!searchResults && (
                <Button onClick={() => navigate('/app')}>Upload Photos</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-border hover:border-gray-400/50 transition-all"
                >
                  <div className="aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Score Badge */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-300">
                    {analyzing.has(photo.id) ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : photo.overall_score ? (
                      photo.overall_score.toFixed(1)
                    ) : (
                      'N/A'
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePromoteToStars(photo.id)}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Promote
                    </Button>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] text-white/80 truncate">{photo.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended for Removal Section */}
        {lowQualityPhotos.length > 0 && (
          <div ref={removalSectionRef} className="mt-16 pt-8 border-t border-orange-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                <div>
                  <h2 className="text-xl font-semibold text-orange-400">
                    Recommended for Removal ({lowQualityPhotos.length})
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    These photos scored below {LOW_QUALITY_THRESHOLD} and may be low quality
                  </p>
                </div>
              </div>
              
              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 ? (
                  <>
                    <Badge variant="secondary">{selectedIds.size} selected</Badge>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Selected
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllLowQuality}
                    className="text-orange-400 border-orange-400/50"
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Select All
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {lowQualityPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedIds.has(photo.id) 
                      ? 'border-destructive bg-destructive/10' 
                      : 'border-orange-500/30 bg-orange-500/5'
                  }`}
                  onClick={() => toggleSelectPhoto(photo.id)}
                >
                  <div className="aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className={`w-full h-full object-cover ${selectedIds.has(photo.id) ? 'opacity-50' : 'opacity-75'}`}
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(photo.id)}
                      onCheckedChange={() => toggleSelectPhoto(photo.id)}
                      className="border-white bg-black/50"
                    />
                  </div>

                  {/* Score Badge */}
                  <div className="absolute top-2 right-2 bg-orange-500/90 px-2 py-1 rounded text-xs font-bold text-white">
                    {photo.overall_score?.toFixed(1) || 'N/A'}
                  </div>

                  {/* Delete Button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] text-white/80 truncate">{photo.filename}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Return to Top */}
            <div className="mt-8 text-center">
              <Button variant="outline" onClick={scrollToTop}>
                <ArrowUp className="w-4 h-4 mr-2" />
                Return to Top
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
