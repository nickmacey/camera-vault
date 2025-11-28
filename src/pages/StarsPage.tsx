import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Wand2, Check, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, getPhotoValueByScore } from "@/lib/photoValue";
import { PhotoEditor } from "@/components/PhotoEditor";

interface StarsPhoto {
  id: string;
  filename: string;
  storage_path: string;
  edited_storage_path?: string | null;
  overall_score: number | null;
  description: string | null;
  url?: string;
  editedUrl?: string;
}

export default function StarsPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<StarsPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<StarsPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStarsPhotos();
  }, []);

  const fetchStarsPhotos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('photos')
      .select('id, filename, storage_path, edited_storage_path, overall_score, description')
      .eq('user_id', user.id)
      .eq('tier', 'high-value')
      .order('overall_score', { ascending: false });

    if (error) {
      toast.error("Failed to load photos");
      return;
    }

    const photosWithUrls = await Promise.all(
      (data || []).map(async (photo) => {
        const { data: urlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 3600);
        
        let editedUrl: string | undefined;
        if (photo.edited_storage_path) {
          const { data: editedUrlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.edited_storage_path, 3600);
          editedUrl = editedUrlData?.signedUrl;
        }
        
        return { ...photo, url: urlData?.signedUrl || '', editedUrl };
      })
    );

    setPhotos(photosWithUrls);
    setLoading(false);
  };

  const totalValue = photos.reduce((sum, p) => sum + getPhotoValueByScore(p.overall_score), 0);

  const handlePromoteToVault = async (photoId: string) => {
    const { error } = await supabase
      .from('photos')
      .update({ tier: 'vault-worthy' })
      .eq('id', photoId);

    if (error) {
      toast.error("Failed to promote photo");
      return;
    }

    toast.success("Photo promoted to Vault!");
    setSelectedPhoto(null);
    fetchStarsPhotos();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <Star className="w-6 h-6" />
                STARS STUDIO
              </h1>
              <p className="text-sm text-muted-foreground">Refine your photos with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-emerald-400 border-emerald-400">
              {photos.length} Photos • {formatCurrency(totalValue)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {selectedPhoto ? (
          /* Photo Editor View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Gallery
              </Button>
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-500/20 text-emerald-400">
                  Score: {selectedPhoto.overall_score?.toFixed(1) || 'N/A'}
                </Badge>
                <Button 
                  onClick={() => handlePromoteToVault(selectedPhoto.id)}
                  className="bg-vault-gold hover:bg-vault-gold/90 text-background"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Promote to Vault
                </Button>
              </div>
            </div>
            
            <PhotoEditor 
              photoUrl={selectedPhoto.url || ''} 
              photoId={selectedPhoto.id}
              filename={selectedPhoto.filename}
              editedUrl={selectedPhoto.editedUrl}
              onSaveComplete={fetchStarsPhotos}
            />
          </div>
        ) : (
          /* Gallery View */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Photo Grid - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center gap-3">
                  <Wand2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-medium">Photo Editing Studio</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a photo to edit, enhance, and promote to your Vault
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-20">
                  <Star className="w-16 h-16 mx-auto text-emerald-400/50 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Stars Yet</h3>
                  <p className="text-muted-foreground mb-6">Upload photos to discover your rising stars</p>
                  <Button onClick={() => navigate('/app')}>Upload Photos</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-400/50 transition-all"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <div className="aspect-square">
                        <img
                          src={photo.url}
                          alt={photo.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Score Badge */}
                      {photo.overall_score && (
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-bold text-emerald-400">
                          {photo.overall_score.toFixed(1)}
                        </div>
                      )}

                      {/* Edit Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center">
                          <Wand2 className="w-8 h-8 text-white mx-auto mb-2" />
                          <span className="text-white text-sm font-medium">Edit Photo</span>
                        </div>
                      </div>

                      {/* Bottom Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs text-white/80 truncate">{photo.filename}</p>
                        <p className="text-xs text-emerald-400 font-semibold">
                          {formatCurrency(getPhotoValueByScore(photo.overall_score))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar - Tips */}
            <div className="space-y-6">
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Editing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">🎨 Adjust Settings</h4>
                    <p className="text-muted-foreground text-xs">
                      Fine-tune brightness, contrast, and saturation to perfect your shot.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">✨ Apply Presets</h4>
                    <p className="text-muted-foreground text-xs">
                      Use one-click presets for instant professional looks.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">🚀 Promote to Vault</h4>
                    <p className="text-muted-foreground text-xs">
                      When your photo is ready, promote it to your Vault for sharing.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🤖</span>
                    <h4 className="font-semibold text-sm mb-1">AI Enhancement</h4>
                    <p className="text-xs text-muted-foreground">
                      Coming soon: One-click AI enhancement to elevate your photos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
