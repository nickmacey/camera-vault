import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Lock, Grid, Filter, Search, Trash2, RefreshCw, CheckSquare, Square, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import PhotoCard from "./PhotoCard";
import { Lightbox } from "./Lightbox";
import { WatermarkStudio, WatermarkConfig } from "./WatermarkStudio";
import { applyWatermarkToImage, downloadImage } from "@/lib/watermark";
import JSZip from "jszip";

const PhotoGallery = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [watermarkStudioPhoto, setWatermarkStudioPhoto] = useState<any | null>(null);

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
  }, [filterStatus, scoreFilter, sortBy, searchQuery, isAuthenticated]);

  const toggleSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      setBatchProcessing(true);
      const toastId = toast.loading(`Deleting ${selectedPhotos.size} photo(s)...`);

      const selectedArray = Array.from(selectedPhotos);
      
      // Get storage paths before deleting from database
      const photosToDelete = photos.filter(p => selectedArray.includes(p.id));
      
      // Delete from storage
      const storagePaths = photosToDelete.flatMap(p => 
        [p.storage_path, p.thumbnail_path].filter(Boolean)
      );
      
      await Promise.all(
        storagePaths.map(path => 
          supabase.storage.from('photos').remove([path])
        )
      );

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .in('id', selectedArray);

      if (error) throw error;

      toast.success(`Deleted ${selectedPhotos.size} photo(s)`, { id: toastId });
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      fetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete photos");
    } finally {
      setBatchProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBatchReanalyze = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      setBatchProcessing(true);
      const toastId = toast.loading(`Re-analyzing ${selectedPhotos.size} photo(s)...`);

      const selectedArray = Array.from(selectedPhotos);
      const photosToAnalyze = photos.filter(p => selectedArray.includes(p.id));
      
      let successCount = 0;
      const batchSize = 2; // Process 2 at a time to avoid rate limits

      for (let i = 0; i < photosToAnalyze.length; i += batchSize) {
        const batch = photosToAnalyze.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (photo) => {
          try {
            // Download image from storage
            const { data: imageData } = await supabase.storage
              .from('photos')
              .download(photo.storage_path);

            if (!imageData) throw new Error("Failed to download image");

            // Convert to base64
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
              };
              reader.readAsDataURL(imageData);
            });

            // Call AI analysis
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-photo', {
              body: { imageBase64: base64, filename: photo.filename }
            });

            if (!analysisError && analysisData) {
              // Update photo with new analysis
              await supabase
                .from('photos')
                .update({
                  score: analysisData.score,
                  description: analysisData.description
                })
                .eq('id', photo.id);
              
              successCount++;
            }
          } catch (error) {
            console.error(`Failed to re-analyze ${photo.filename}:`, error);
          }
        }));
        
        toast.loading(`Re-analyzing... ${Math.min(i + batchSize, photosToAnalyze.length)}/${photosToAnalyze.length}`, { id: toastId });
      }

      toast.success(`Re-analyzed ${successCount} photo(s)`, { id: toastId });
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      fetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Failed to re-analyze photos");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedPhotos.size === 0) return;

    try {
      setBatchProcessing(true);
      const toastId = toast.loading(`Updating ${selectedPhotos.size} photo(s)...`);

      const selectedArray = Array.from(selectedPhotos);
      
      const { error } = await supabase
        .from('photos')
        .update({ status: newStatus })
        .in('id', selectedArray);

      if (error) throw error;

      toast.success(`Updated ${selectedPhotos.size} photo(s) to ${newStatus}`, { id: toastId });
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      fetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Failed to update photos");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleApplyWatermark = async (photo: any, config: WatermarkConfig) => {
    try {
      // Apply watermark to image
      const watermarkedBlob = await applyWatermarkToImage(photo.url, config);
      
      // Upload watermarked version
      const fileName = `${photo.storage_path.replace(/\.[^/.]+$/, '')}_watermarked.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, watermarkedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Update database
      const { error: dbError } = await supabase
        .from('photos')
        .update({
          watermarked: true,
          watermark_config: config as any,
          watermark_applied_at: new Date().toISOString()
        })
        .eq('id', photo.id);

      if (dbError) throw dbError;

      fetchPhotos();
    } catch (error) {
      console.error('Failed to apply watermark:', error);
      throw error;
    }
  };

  const handleBatchWatermark = async (preset: 'vault' | 'branded' | 'stealth') => {
    if (selectedPhotos.size === 0) return;

    try {
      setBatchProcessing(true);
      const toastId = toast.loading(`Watermarking ${selectedPhotos.size} photo(s)...`);

      const selectedArray = Array.from(selectedPhotos);
      const photosToWatermark = photos.filter(p => selectedArray.includes(p.id));
      
      const presetConfigs: Record<string, Partial<WatermarkConfig>> = {
        vault: { mode: 'fortress', text: 'PROTECTED', opacity: 70, position: 'tiled', fontSize: 32, color: '#ff0000' },
        branded: { mode: 'branded', text: '© PhotoCurator', opacity: 40, position: 'bottom-right', fontSize: 24, color: '#ffffff' },
        stealth: { mode: 'stealth', text: '© PhotoCurator', opacity: 15, position: 'bottom-right', fontSize: 12, color: '#ffffff' }
      };

      let successCount = 0;

      for (const photo of photosToWatermark) {
        try {
          await handleApplyWatermark(photo, presetConfigs[preset] as WatermarkConfig);
          successCount++;
        } catch (error) {
          console.error(`Failed to watermark ${photo.filename}:`, error);
        }
      }

      toast.success(`Watermarked ${successCount} photo(s)`, { id: toastId });
      setSelectedPhotos(new Set());
      setSelectionMode(false);
      fetchPhotos();
    } catch (error: any) {
      toast.error(error.message || "Failed to watermark photos");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleExportSelected = async (format: 'jpg' | 'png' | 'zip') => {
    if (selectedPhotos.size === 0) return;

    try {
      setBatchProcessing(true);
      const toastId = toast.loading(`Exporting ${selectedPhotos.size} photo(s)...`);

      const selectedArray = Array.from(selectedPhotos);
      const photosToExport = photos.filter(p => selectedArray.includes(p.id));

      if (format === 'zip') {
        const zip = new JSZip();
        const folder = zip.folder('exported-photos');

        await Promise.all(
          photosToExport.map(async (photo, index) => {
            try {
              const response = await fetch(photo.url);
              const blob = await response.blob();
              const extension = photo.filename.split('.').pop() || 'jpg';
              const watermarkSuffix = photo.watermarked ? '-protected' : '';
              const filename = `${index + 1}-${photo.filename.replace(/\.[^/.]+$/, '')}${watermarkSuffix}.${extension}`;
              folder?.file(filename, blob);
            } catch (error) {
              console.error(`Failed to export ${photo.filename}:`, error);
            }
          })
        );

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadImage(zipBlob, `exported-photos-${new Date().toISOString().split('T')[0]}.zip`);
      } else {
        // Download individual files
        for (const photo of photosToExport) {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const watermarkSuffix = photo.watermarked ? '-protected' : '';
          downloadImage(blob, `${photo.filename.replace(/\.[^/.]+$/, '')}${watermarkSuffix}.${format}`);
        }
      }

      toast.success(`Exported ${selectedPhotos.size} photo(s)`, { id: toastId });
    } catch (error: any) {
      toast.error(error.message || "Failed to export photos");
    } finally {
      setBatchProcessing(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('photos')
        .select('*');

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply score filter
      if (scoreFilter !== 'all') {
        const [min, max] = scoreFilter.split('-').map(Number);
        if (max) {
          query = query.gte('score', min).lte('score', max);
        } else {
          query = query.gte('score', min);
        }
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.ilike('filename', `%${searchQuery.trim()}%`);
      }

      // Apply sorting
      const [field, direction] = sortBy.split('-');
      query = query.order(field, { ascending: direction === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      // Get signed URLs for photos and thumbnails
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const thumbnailPath = photo.thumbnail_path || photo.storage_path;
          const [urlData, thumbnailData] = await Promise.all([
            supabase.storage.from('photos').createSignedUrl(photo.storage_path, 3600),
            supabase.storage.from('photos').createSignedUrl(thumbnailPath, 3600)
          ]);

          return {
            ...photo,
            url: urlData?.data?.signedUrl,
            thumbnailUrl: thumbnailData?.data?.signedUrl || urlData?.data?.signedUrl
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
      <Card className="p-6 bg-vault-dark-gray border-vault-mid-gray">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vault-light-gray" />
                <Input
                  placeholder="SEARCH ASSETS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-vault-black border-vault-mid-gray text-vault-platinum placeholder:text-vault-light-gray uppercase text-sm tracking-wide"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] bg-vault-black border-vault-mid-gray text-vault-platinum">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-vault-dark-gray border-vault-mid-gray">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-[180px] bg-vault-black border-vault-mid-gray text-vault-platinum">
                  <SelectValue placeholder="Score Range" />
                </SelectTrigger>
                <SelectContent className="bg-vault-dark-gray border-vault-mid-gray">
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="80-100">8.5-10 (Vault Worthy)</SelectItem>
                  <SelectItem value="70-79">7.0-8.5 (High Value)</SelectItem>
                  <SelectItem value="60-69">6.0-7.0 (Standard)</SelectItem>
                  <SelectItem value="0-59">Below 6.0 (Archive)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-vault-black border-vault-mid-gray text-vault-platinum">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-vault-dark-gray border-vault-mid-gray">
                  <SelectItem value="score-desc">Score: High to Low</SelectItem>
                  <SelectItem value="score-asc">Score: Low to High</SelectItem>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={selectionMode ? "default" : "outline"}
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedPhotos(new Set());
              }}
              className={selectionMode 
                ? "bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold uppercase tracking-wide" 
                : "bg-vault-black border-vault-mid-gray text-vault-platinum hover:border-vault-gold font-bold uppercase tracking-wide"
              }
            >
              {selectionMode ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
              {selectionMode ? "Cancel" : "Select Assets"}
            </Button>
          </div>

          {selectionMode && selectedPhotos.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-4 bg-vault-gold/10 rounded-lg border-2 border-vault-gold/30 vault-glow-gold">
              <span className="text-sm font-bold text-vault-gold uppercase tracking-wide">
                {selectedPhotos.size} ASSET{selectedPhotos.size !== 1 ? 'S' : ''} SELECTED
              </span>
              <div className="flex flex-wrap gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={selectAll}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAll}>
                  Deselect All
                </Button>
                <Select onValueChange={handleBatchStatusUpdate} disabled={batchProcessing}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Mark as New</SelectItem>
                    <SelectItem value="approved">Mark as Approved</SelectItem>
                    <SelectItem value="rejected">Mark as Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => handleBatchWatermark(value as any)} disabled={batchProcessing}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Add Watermark" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vault">🔒 Vault Protection</SelectItem>
                    <SelectItem value="branded">© Branded</SelectItem>
                    <SelectItem value="stealth">🔹 Stealth</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => handleExportSelected(value as any)} disabled={batchProcessing}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zip">📦 ZIP</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBatchReanalyze}
                  disabled={batchProcessing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-analyze
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={batchProcessing}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <Card className="p-16 text-center bg-vault-dark-gray border-vault-mid-gray">
          <div className="animate-pulse text-vault-light-gray font-bold uppercase tracking-wide">Accessing Vault...</div>
        </Card>
      ) : !isAuthenticated ? (
        <Card className="p-16 text-center bg-vault-dark-gray border-vault-mid-gray">
          <div className="inline-flex p-6 rounded-lg bg-vault-gold/10 border border-vault-gold/20 mb-6">
            <Lock className="h-16 w-16 text-vault-gold" />
          </div>
          <h3 className="text-2xl font-black mb-3 text-vault-platinum uppercase tracking-tight">Vault Access Required</h3>
          <p className="text-vault-light-gray mb-6 max-w-md mx-auto">
            Create an account or sign in to secure and manage your creative assets
          </p>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold uppercase tracking-wide vault-glow-gold"
          >
            <Lock className="h-4 w-4 mr-2" />
            Access Vault
          </Button>
        </Card>
      ) : photos.length === 0 ? (
        <Card className="p-16 text-center bg-vault-dark-gray border-vault-mid-gray">
          <div className="inline-flex p-6 rounded-lg bg-vault-gold/10 border border-vault-gold/20 mb-6">
            <Shield className="h-16 w-16 text-vault-gold" />
          </div>
          <h3 className="text-2xl font-black mb-3 text-vault-platinum uppercase tracking-tight">Vault Empty</h3>
          <p className="text-vault-light-gray max-w-md mx-auto">
            Secure your first assets with AI-powered scoring and protection
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => !selectionMode && setLightboxPhoto(photo)}
            selectionMode={selectionMode}
            isSelected={selectedPhotos.has(photo.id)}
            onToggleSelect={() => toggleSelection(photo.id)}
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
          onWatermark={(photo) => {
            setWatermarkStudioPhoto(photo);
            setLightboxPhoto(null);
          }}
        />
      )}

      {watermarkStudioPhoto && (
        <WatermarkStudio
          photo={watermarkStudioPhoto}
          open={!!watermarkStudioPhoto}
          onClose={() => setWatermarkStudioPhoto(null)}
          onApply={(config) => handleApplyWatermark(watermarkStudioPhoto, config)}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPhotos.size} photo(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected photos and remove them from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PhotoGallery;
