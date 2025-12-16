import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X, Plus, Palette, User } from 'lucide-react';
import { toast } from 'sonner';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MediaItem {
  id: string;
  filename: string;
  storage_path: string;
  thumbnail_path: string | null;
  is_highlight_reel: boolean;
  highlight_reel_order: number | null;
  highlight_reel_preset: string | null;
  overall_score: number | null;
  mime_type: string | null;
}

const presetLabels: Record<string, string> = {
  bw: "Black & White",
  color: "Vibrant Color",
  film: "Old Film",
};

const presetStyles: Record<string, string> = {
  bw: "grayscale(100%) contrast(1.1)",
  color: "saturate(1.3) contrast(1.05) brightness(1.02)",
  film: "sepia(0.35) contrast(0.95) brightness(1.05) saturate(0.9)",
};

interface MediaWithUrl extends MediaItem {
  url?: string;
}

export function HighlightReelManager() {
  const [allMedia, setAllMedia] = useState<MediaWithUrl[]>([]);
  const [reelMedia, setReelMedia] = useState<MediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadMedia = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: media, error } = await supabase
        .from('photos')
        .select('id, filename, storage_path, thumbnail_path, is_highlight_reel, highlight_reel_order, highlight_reel_preset, overall_score, mime_type')
        .eq('user_id', user.id)
        .order('overall_score', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Generate signed URLs for all media
      const mediaWithUrls = await Promise.all(
        (media || []).map(async (item) => {
          const pathToUse = item.thumbnail_path || item.storage_path;
          const { data: signedData } = await supabase.storage
            .from('photos')
            .createSignedUrl(pathToUse, 3600); // 1 hour expiry
          return {
            ...item,
            url: signedData?.signedUrl || ''
          };
        })
      );

      const reel = mediaWithUrls.filter(m => m.is_highlight_reel).sort((a, b) => (a.highlight_reel_order || 0) - (b.highlight_reel_order || 0));
      const nonReel = mediaWithUrls.filter(m => !m.is_highlight_reel);

      setReelMedia(reel);
      setAllMedia(nonReel);
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const toggleReel = async (mediaId: string, currentlyInReel: boolean, preset?: string) => {
    try {
      if (currentlyInReel) {
        await supabase
          .from('photos')
          .update({ is_highlight_reel: false, highlight_reel_order: null, highlight_reel_preset: null })
          .eq('id', mediaId);
        toast.success('Removed from highlight reel');
      } else {
        const maxOrder = Math.max(0, ...reelMedia.map(m => m.highlight_reel_order || 0));
        await supabase
          .from('photos')
          .update({ 
            is_highlight_reel: true, 
            highlight_reel_order: maxOrder + 1,
            highlight_reel_preset: preset || 'color'
          })
          .eq('id', mediaId);
        toast.success('Added to highlight reel');
      }
      
      await loadMedia();
    } catch (error) {
      console.error('Error toggling reel:', error);
      toast.error('Failed to update');
    }
  };

  const changePreset = async (mediaId: string, preset: string) => {
    try {
      await supabase
        .from('photos')
        .update({ highlight_reel_preset: preset })
        .eq('id', mediaId);
      toast.success(`Changed to ${presetLabels[preset]}`);
      await loadMedia();
    } catch (error) {
      console.error('Error changing preset:', error);
      toast.error('Failed to change preset');
    }
  };

  const moveMedia = async (mediaId: string, direction: 'up' | 'down') => {
    const index = reelMedia.findIndex(m => m.id === mediaId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === reelMedia.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const swapMedia = reelMedia[newIndex];

    try {
      await supabase
        .from('photos')
        .update({ highlight_reel_order: index })
        .eq('id', swapMedia.id);

      await supabase
        .from('photos')
        .update({ highlight_reel_order: newIndex })
        .eq('id', mediaId);

      await loadMedia();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
    }
  };

  const isVideo = (mimeType: string | null) => mimeType?.startsWith('video/') || false;

  if (loading) {
    return <div className="text-center py-8">Loading media...</div>;
  }

  // Group reel media by preset
  const groupedByPreset = {
    bw: reelMedia.filter(m => m.highlight_reel_preset === 'bw'),
    color: reelMedia.filter(m => m.highlight_reel_preset === 'color'),
    film: reelMedia.filter(m => m.highlight_reel_preset === 'film'),
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo Section */}
      <Card className="p-6 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-vault-gold" />
          <h3 className="text-xl font-bold text-foreground">Profile Photo</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          Upload a photo of yourself to display on your story page.
        </p>
        <div className="flex justify-center">
          <ProfilePhotoUpload
            currentAvatarUrl={avatarUrl}
            onUploadComplete={(url) => setAvatarUrl(url)}
            size="lg"
          />
        </div>
      </Card>

      <Card className="p-6 bg-card">
        <h3 className="text-xl font-bold mb-4 text-foreground">Highlight Reel ({reelMedia.length})</h3>
        <p className="text-muted-foreground mb-6">
          Customize which photos and videos appear in your story. Assign each to a visual preset.
        </p>
        
        {reelMedia.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No media selected. Click on photos below to add them.
          </div>
        ) : (
          <div className="space-y-6">
            {(['bw', 'color', 'film'] as const).map((preset) => (
              groupedByPreset[preset].length > 0 && (
                <div key={preset}>
                  <h4 className="text-sm font-semibold text-vault-gold mb-3 uppercase tracking-wider">
                    {presetLabels[preset]} ({groupedByPreset[preset].length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {groupedByPreset[preset].map((item, index) => (
                      <div key={item.id} className="relative group">
                        <div 
                          className="w-full aspect-square overflow-hidden rounded-lg"
                          style={{ filter: presetStyles[preset] }}
                        >
                          {isVideo(item.mime_type) ? (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt={item.filename}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveMedia(item.id, 'up')}
                            disabled={index === 0}
                            className="bg-background/80 h-8 w-8 p-0"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveMedia(item.id, 'down')}
                            disabled={index === groupedByPreset[preset].length - 1}
                            className="bg-background/80 h-8 w-8 p-0"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="bg-background/80 h-8 w-8 p-0">
                                <Palette className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {Object.entries(presetLabels).map(([key, label]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => changePreset(item.id, key)}
                                  className={item.highlight_reel_preset === key ? 'bg-accent' : ''}
                                >
                                  {label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleReel(item.id, true)}
                            className="bg-background/80 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-card">
        <h3 className="text-xl font-bold mb-4 text-foreground">Available Media</h3>
        <p className="text-muted-foreground mb-4">
          Click on any photo or video to add it to your highlight reel
        </p>
        
        {allMedia.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            All your media is in the highlight reel!
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
            {allMedia.map((item) => (
              <DropdownMenu key={item.id}>
                <DropdownMenuTrigger asChild>
                  <button className="relative group cursor-pointer">
                    <div className="w-full aspect-square overflow-hidden rounded-lg">
                      {isVideo(item.mime_type) ? (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    {item.overall_score && (
                      <div className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold">
                        {item.overall_score.toFixed(1)}
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => toggleReel(item.id, false, 'bw')}>
                    Add as Black & White
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleReel(item.id, false, 'color')}>
                    Add as Vibrant Color
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleReel(item.id, false, 'film')}>
                    Add as Old Film
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}