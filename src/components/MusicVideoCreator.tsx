import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Music, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Plus,
  X,
  Download,
  Share2,
  Shuffle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getSpotifyConnection,
  getPlaylists, 
  getLikedSongs, 
  getPlaylistTracks,
  SpotifyTrack,
  SpotifyPlaylist
} from "@/lib/spotify";

interface SelectedPhoto {
  id: string;
  url: string;
  filename: string;
}

export function MusicVideoCreator() {
  const [isConnected, setIsConnected] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [likedSongs, setLikedSongs] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [userPhotos, setUserPhotos] = useState<SelectedPhoto[]>([]);
  const [photoDuration, setPhotoDuration] = useState(3); // seconds per photo
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkConnectionAndFetch();
    fetchUserPhotos();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const checkConnectionAndFetch = async () => {
    try {
      const connection = await getSpotifyConnection();
      if (connection) {
        setIsConnected(true);
        await fetchSpotifyData();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpotifyData = async () => {
    try {
      const [playlistsData, likedData] = await Promise.all([
        getPlaylists(),
        getLikedSongs(),
      ]);
      
      if (playlistsData?.items) {
        setPlaylists(playlistsData.items);
      }
      if (likedData?.items) {
        setLikedSongs(likedData.items.map((item: any) => item.track));
      }
    } catch (err) {
      console.error('Error fetching Spotify data:', err);
      toast.error('Failed to load Spotify data');
    }
  };

  const fetchUserPhotos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: photos } = await supabase
        .from('photos')
        .select('id, filename, storage_path')
        .eq('user_id', user.id)
        .order('overall_score', { ascending: false })
        .limit(50);

      if (photos) {
        const photosWithUrls = await Promise.all(
          photos.map(async (photo) => {
            const { data } = supabase.storage
              .from('photos')
              .getPublicUrl(photo.storage_path);
            return {
              id: photo.id,
              url: data.publicUrl,
              filename: photo.filename,
            };
          })
        );
        setUserPhotos(photosWithUrls);
      }
    } catch (err) {
      console.error('Error fetching photos:', err);
    }
  };

  const handleSelectTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    if (audioRef.current && track.preview_url) {
      audioRef.current.src = track.preview_url;
    }
  };

  const togglePlay = () => {
    if (!selectedTrack?.preview_url) {
      toast.error('No preview available for this track');
      return;
    }
    if (selectedPhotos.length === 0) {
      toast.error('Add some photos first');
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      audioRef.current?.play();
      intervalRef.current = setInterval(() => {
        setCurrentPhotoIndex(prev => 
          prev >= selectedPhotos.length - 1 ? 0 : prev + 1
        );
      }, photoDuration * 1000);
    }
    setIsPlaying(!isPlaying);
  };

  const addPhoto = (photo: SelectedPhoto) => {
    if (selectedPhotos.find(p => p.id === photo.id)) {
      toast.error('Photo already added');
      return;
    }
    setSelectedPhotos([...selectedPhotos, photo]);
  };

  const removePhoto = (photoId: string) => {
    setSelectedPhotos(selectedPhotos.filter(p => p.id !== photoId));
  };

  const shufflePhotos = () => {
    setSelectedPhotos([...selectedPhotos].sort(() => Math.random() - 0.5));
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-12 text-center">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-12 text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Connect Spotify to create music videos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* Preview Area */}
      <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
        <div className="aspect-[9/16] max-h-[400px] relative bg-black flex items-center justify-center">
          {selectedPhotos.length > 0 ? (
            <img
              src={selectedPhotos[currentPhotoIndex]?.url}
              alt="Video preview"
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Add photos to preview</p>
            </div>
          )}
          
          {/* Track overlay */}
          {selectedTrack && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3">
                {selectedTrack.album.images[0] && (
                  <img 
                    src={selectedTrack.album.images[0].url} 
                    alt={selectedTrack.album.name}
                    className="w-12 h-12 rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedTrack.name}</p>
                  <p className="text-white/70 text-sm truncate">
                    {selectedTrack.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={shufflePhotos}
              disabled={selectedPhotos.length < 2}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              onClick={togglePlay}
              disabled={!selectedTrack || selectedPhotos.length === 0}
              className="bg-vault-gold text-vault-dark hover:bg-vault-gold/90"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Duration slider */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Photo duration
              </span>
              <span>{photoDuration}s</span>
            </div>
            <Slider
              value={[photoDuration]}
              onValueChange={([value]) => setPhotoDuration(value)}
              min={1}
              max={10}
              step={0.5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Photos */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Photos ({selectedPhotos.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPhotoSelector(!showPhotoSelector)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedPhotos.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {selectedPhotos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden ${
                    index === currentPhotoIndex && isPlaying ? 'ring-2 ring-vault-gold' : ''
                  }`}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-0 right-0 bg-black/60 rounded-bl p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No photos selected
            </p>
          )}

          {/* Photo selector */}
          {showPhotoSelector && (
            <div className="mt-4 border-t pt-4">
              <ScrollArea className="h-32">
                <div className="flex gap-2 flex-wrap">
                  {userPhotos.map(photo => (
                    <button
                      key={photo.id}
                      onClick={() => addPhoto(photo)}
                      className="w-14 h-14 rounded overflow-hidden hover:ring-2 ring-vault-gold transition-all"
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Music Selection */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#1DB954]" />
            Select Music
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {/* Liked Songs Section */}
              {likedSongs.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Liked Songs
                  </p>
                  {likedSongs.slice(0, 10).map(track => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
                        selectedTrack?.id === track.id ? 'bg-vault-gold/10 border border-vault-gold/30' : ''
                      }`}
                    >
                      {track.album.images[2] && (
                        <img 
                          src={track.album.images[2].url} 
                          alt="" 
                          className="w-10 h-10 rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium truncate text-sm">{track.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artists.map(a => a.name).join(', ')}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(track.duration_ms)}
                      </span>
                      {!track.preview_url && (
                        <Badge variant="outline" className="text-xs">No preview</Badge>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
