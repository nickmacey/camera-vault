import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Music, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Plus,
  X,
  Share2,
  Shuffle,
  Clock,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Home,
  Search,
  PlusSquare,
  User,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getSpotifyConnection,
  getPlaylists, 
  getLikedSongs,
  searchTracks,
  getPopularTracks,
  SpotifyTrack,
  SpotifyPlaylist
} from "@/lib/spotify";

interface SelectedPhoto {
  id: string;
  url: string;
  filename: string;
  description?: string;
  ai_analysis?: string;
}

type PlatformType = 'instagram' | 'tiktok' | 'youtube';

const platformConfig = {
  instagram: {
    name: 'Instagram',
    aspectRatio: '4/5',
    color: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
  },
  tiktok: {
    name: 'TikTok',
    aspectRatio: '9/16',
    color: 'bg-black',
  },
  youtube: {
    name: 'YouTube Shorts',
    aspectRatio: '9/16',
    color: 'bg-red-600',
  },
};

export function MusicVideoCreator() {
  const [isConnected, setIsConnected] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [likedSongs, setLikedSongs] = useState<SpotifyTrack[]>([]);
  const [popularTracks, setPopularTracks] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [userPhotos, setUserPhotos] = useState<SelectedPhoto[]>([]);
  const [photoDuration, setPhotoDuration] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPhotoSelector, setShowPhotoSelector] = useState(true);
  const [photoSearchQuery, setPhotoSearchQuery] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('instagram');
  const [photosLoading, setPhotosLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkConnectionAndFetch();
    fetchUserPhotos();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTracks(searchQuery);
        if (results?.tracks?.items) {
          // Filter to only tracks with previews
          const tracksWithPreviews = results.tracks.items.filter(
            (track: SpotifyTrack) => track.preview_url
          );
          setSearchResults(tracksWithPreviews);
        }
      } catch (err) {
        console.error('Search error:', err);
        toast.error('Failed to search tracks');
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [searchQuery]);

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
    setTracksLoading(true);
    try {
      const [playlistsData, likedData, popularData] = await Promise.all([
        getPlaylists(),
        getLikedSongs(),
        getPopularTracks(),
      ]);
      
      if (playlistsData?.items) {
        setPlaylists(playlistsData.items);
      }
      if (likedData?.items) {
        // Filter to only include tracks with preview URLs
        const tracksWithPreviews = likedData.items
          .map((item: any) => item.track)
          .filter((track: SpotifyTrack) => track.preview_url);
        setLikedSongs(tracksWithPreviews);
      }
      if (popularData?.items) {
        // Filter popular tracks to only those with preview URLs
        const popularWithPreviews = popularData.items
          .map((item: any) => item.track)
          .filter((track: SpotifyTrack) => track?.preview_url);
        setPopularTracks(popularWithPreviews);
      }
    } catch (err) {
      console.error('Error fetching Spotify data:', err);
      toast.error('Failed to load Spotify data');
    } finally {
      setTracksLoading(false);
    }
  };

  const fetchUserPhotos = async () => {
    setPhotosLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: photos } = await supabase
        .from('photos')
        .select('id, filename, storage_path, description, ai_analysis')
        .eq('user_id', user.id)
        .order('overall_score', { ascending: false })
        .limit(100);

      if (photos && photos.length > 0) {
        // Use signed URLs since the bucket is private
        const photosWithUrls = await Promise.all(
          photos.map(async (photo) => {
            const { data } = await supabase.storage
              .from('photos')
              .createSignedUrl(photo.storage_path, 3600);
            return {
              id: photo.id,
              url: data?.signedUrl || '',
              filename: photo.filename,
              description: photo.description || '',
              ai_analysis: photo.ai_analysis || '',
            };
          })
        );
        setUserPhotos(photosWithUrls.filter(p => p.url));
      }
    } catch (err) {
      console.error('Error fetching photos:', err);
      toast.error('Failed to load photos');
    } finally {
      setPhotosLoading(false);
    }
  };

  // Filter photos based on search query
  const filteredPhotos = photoSearchQuery.trim()
    ? userPhotos.filter(photo => {
        const query = photoSearchQuery.toLowerCase();
        return (
          photo.filename.toLowerCase().includes(query) ||
          photo.description?.toLowerCase().includes(query) ||
          photo.ai_analysis?.toLowerCase().includes(query)
        );
      })
    : userPhotos;

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
      audioRef.current?.play().catch(err => {
        console.error('Audio play error:', err);
        toast.error('Could not play audio preview');
      });
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
    toast.success('Photo added');
  };

  const removePhoto = (photoId: string) => {
    setSelectedPhotos(selectedPhotos.filter(p => p.id !== photoId));
  };

  const shufflePhotos = () => {
    setSelectedPhotos([...selectedPhotos].sort(() => Math.random() - 0.5));
    toast.success('Photos shuffled');
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
            Connect Spotify above to create music videos
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentConfig = platformConfig[platform];

  return (
    <div className="space-y-6">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* Platform Selector */}
      <div className="flex justify-center gap-2">
        {(Object.keys(platformConfig) as PlatformType[]).map((p) => (
          <Button
            key={p}
            variant={platform === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPlatform(p)}
            className={platform === p ? "bg-primary text-primary-foreground" : ""}
          >
            {platformConfig[p].name}
          </Button>
        ))}
      </div>

      {/* Phone Mockup Preview */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Phone Frame */}
          <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20" />
            
            {/* Screen */}
            <div 
              className="relative bg-black rounded-[2.5rem] overflow-hidden"
              style={{ 
                width: platform === 'instagram' ? '320px' : '280px',
                aspectRatio: currentConfig.aspectRatio
              }}
            >
              {/* Content Area */}
              <div className="absolute inset-0">
                {selectedPhotos.length > 0 ? (
                  <img
                    src={selectedPhotos[currentPhotoIndex]?.url}
                    alt="Video preview"
                    className="w-full h-full object-cover transition-opacity duration-500"
                    onError={(e) => {
                      console.error('Image failed to load');
                      e.currentTarget.src = '';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
                    <div className="text-center text-muted-foreground p-4">
                      <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Add photos to preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Platform-specific UI Overlay */}
              {platform === 'instagram' && (
                <InstagramOverlay 
                  track={selectedTrack} 
                  isPlaying={isPlaying}
                />
              )}
              {platform === 'tiktok' && (
                <TikTokOverlay 
                  track={selectedTrack}
                  isPlaying={isPlaying}
                />
              )}
              {platform === 'youtube' && (
                <YouTubeOverlay 
                  track={selectedTrack}
                  isPlaying={isPlaying}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
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
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>
        <Button variant="outline" size="icon">
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Duration Slider */}
      <Card className="bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Photo duration
              </span>
              <span className="font-medium">{photoDuration}s</span>
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

      {/* Two Column Layout for Photos and Music */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Photos */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Selected ({selectedPhotos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPhotos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedPhotos.map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex && isPlaying 
                        ? 'border-primary ring-2 ring-primary/50' 
                        : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={photo.url} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1 hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 rounded px-1.5 text-[10px] text-white">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No photos selected. Click "Add Photos" to get started.
              </p>
            )}

            {/* Vault Photos */}
            <div className="mt-4 border-t border-border pt-4">
              {/* Photo Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search photos by keyword..."
                  value={photoSearchQuery}
                  onChange={(e) => setPhotoSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 h-9 text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Your Vault ({filteredPhotos.length}{photoSearchQuery ? ` of ${userPhotos.length}` : ''})
              </p>
              {photosLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Loading photos...</p>
                </div>
              ) : filteredPhotos.length > 0 ? (
                <ScrollArea className="h-48">
                  <div className="grid grid-cols-5 gap-2">
                    {filteredPhotos.map(photo => (
                      <button
                        key={photo.id}
                        onClick={() => addPhoto(photo)}
                        disabled={selectedPhotos.some(p => p.id === photo.id)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPhotos.some(p => p.id === photo.id)
                            ? 'border-primary opacity-50'
                            : 'border-transparent hover:border-primary/50 hover:scale-105'
                        }`}
                      >
                        <img 
                          src={photo.url} 
                          alt={photo.description || ''} 
                          className="w-full h-full object-cover"
                          onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : photoSearchQuery ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No photos match "{photoSearchQuery}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No photos in your vault yet. Upload some photos first!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Music Selection */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Music className="w-4 h-4 text-[#1DB954]" />
              Select Music
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search any song on Spotify..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-1">
                {/* Search Results */}
                {searchQuery.trim() && searchResults.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Search Results ({searchResults.length} playable)
                    </p>
                    {searchResults.map(track => (
                      <TrackButton
                        key={track.id}
                        track={track}
                        isSelected={selectedTrack?.id === track.id}
                        onSelect={handleSelectTrack}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </>
                )}

                {/* No search results message */}
                {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No playable tracks found. Try another search.
                  </p>
                )}

                {/* Popular Tracks (show when not searching) */}
                {!searchQuery.trim() && popularTracks.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      🔥 Trending Now ({popularTracks.length} playable)
                    </p>
                    {popularTracks.slice(0, 15).map(track => (
                      <TrackButton
                        key={track.id}
                        track={track}
                        isSelected={selectedTrack?.id === track.id}
                        onSelect={handleSelectTrack}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </>
                )}

                {/* Liked Songs (show when not searching) */}
                {!searchQuery.trim() && likedSongs.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 mt-4">
                      Your Liked Songs ({likedSongs.length} playable)
                    </p>
                    {likedSongs.slice(0, 20).map(track => (
                      <TrackButton
                        key={track.id}
                        track={track}
                        isSelected={selectedTrack?.id === track.id}
                        onSelect={handleSelectTrack}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </>
                )}

                {/* Loading state for tracks */}
                {!searchQuery.trim() && tracksLoading && (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1DB954]" />
                    <p className="text-xs text-muted-foreground mt-2">Loading trending tracks...</p>
                  </div>
                )}

                {/* Empty state when no search and no popular tracks after loading */}
                {!searchQuery.trim() && !tracksLoading && popularTracks.length === 0 && likedSongs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Search for any song above to get started!
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Track Button Component
function TrackButton({ 
  track, 
  isSelected, 
  onSelect, 
  formatDuration 
}: { 
  track: SpotifyTrack; 
  isSelected: boolean; 
  onSelect: (track: SpotifyTrack) => void;
  formatDuration: (ms: number) => string;
}) {
  return (
    <button
      onClick={() => onSelect(track)}
      className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-primary/10 border border-primary/30' : ''
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
    </button>
  );
}

// Instagram UI Overlay
function InstagramOverlay({ track, isPlaying }: { track: SpotifyTrack | null; isPlaying: boolean }) {
  return (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-0.5">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-white text-sm font-medium">your_username</span>
          </div>
          <MoreHorizontal className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Actions */}
      <div className="absolute bottom-16 right-3 flex flex-col gap-4 z-10">
        <button className="flex flex-col items-center gap-1">
          <Heart className="w-7 h-7 text-white" />
          <span className="text-white text-xs">24.5k</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-white text-xs">482</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Send className="w-7 h-7 text-white" />
        </button>
        <button className="flex flex-col items-center gap-1">
          <Bookmark className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Track Info */}
      {track && (
        <div className="absolute bottom-16 left-3 right-14 z-10">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2 overflow-hidden">
            <Music className="w-4 h-4 text-white flex-shrink-0" />
            <div className="overflow-hidden">
              <span className="text-white text-xs whitespace-nowrap animate-marquee inline-block">
                {track.name} • {track.artists.map(a => a.name).join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-black flex items-center justify-around px-4 z-10">
        <Home className="w-6 h-6 text-white" />
        <Search className="w-6 h-6 text-white/60" />
        <PlusSquare className="w-6 h-6 text-white/60" />
        <Heart className="w-6 h-6 text-white/60" />
        <div className="w-6 h-6 rounded-full bg-gray-600" />
      </div>
    </>
  );
}

// TikTok UI Overlay
function TikTokOverlay({ track, isPlaying }: { track: SpotifyTrack | null; isPlaying: boolean }) {
  return (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-center gap-4">
          <span className="text-white/60 text-base">Following</span>
          <span className="text-white text-base font-semibold border-b-2 border-white pb-1">For You</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="absolute bottom-24 right-3 flex flex-col gap-5 z-10">
        <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-white" />
        <button className="flex flex-col items-center">
          <Heart className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">128.4k</span>
        </button>
        <button className="flex flex-col items-center">
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">2,847</span>
        </button>
        <button className="flex flex-col items-center">
          <Bookmark className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">45.2k</span>
        </button>
        <button className="flex flex-col items-center">
          <Share2 className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">Share</span>
        </button>
        {track?.album.images[2] && (
          <div className="w-12 h-12 rounded-full border-2 border-gray-800 overflow-hidden animate-spin-slow">
            <img src={track.album.images[2].url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-16 left-3 right-16 z-10">
        <p className="text-white font-semibold">@your_username</p>
        <p className="text-white text-sm mt-1">Check out my photos! 📸✨ #photography #vault</p>
        {track && (
          <div className="flex items-center gap-2 mt-2 overflow-hidden">
            <Music className="w-4 h-4 text-white flex-shrink-0" />
            <span className="text-white text-sm whitespace-nowrap animate-marquee">
              {track.name} - {track.artists[0]?.name}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-black flex items-center justify-around px-4 z-10">
        <Home className="w-6 h-6 text-white" />
        <Search className="w-6 h-6 text-white/60" />
        <div className="w-10 h-7 bg-white rounded-lg flex items-center justify-center">
          <Plus className="w-5 h-5 text-black" />
        </div>
        <MessageCircle className="w-6 h-6 text-white/60" />
        <User className="w-6 h-6 text-white/60" />
      </div>
    </>
  );
}

// YouTube Shorts UI Overlay  
function YouTubeOverlay({ track, isPlaying }: { track: SpotifyTrack | null; isPlaying: boolean }) {
  return (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <span className="text-white text-lg font-semibold">Shorts</span>
        <Search className="w-6 h-6 text-white" />
      </div>

      {/* Right Actions */}
      <div className="absolute bottom-24 right-3 flex flex-col gap-5 z-10">
        <button className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-black text-lg">👍</span>
          </div>
          <span className="text-white text-xs mt-1">85k</span>
        </button>
        <button className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-black text-lg">👎</span>
          </div>
          <span className="text-white text-xs mt-1">Dislike</span>
        </button>
        <button className="flex flex-col items-center">
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">1.2k</span>
        </button>
        <button className="flex flex-col items-center">
          <Share2 className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">Share</span>
        </button>
        <button className="flex flex-col items-center">
          <MoreHorizontal className="w-8 h-8 text-white" />
        </button>
        {track?.album.images[2] && (
          <div className="w-10 h-10 rounded-lg border border-white overflow-hidden">
            <img src={track.album.images[2].url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-16 left-3 right-16 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-600" />
          <span className="text-white font-medium">@your_channel</span>
          <button className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
            Subscribe
          </button>
        </div>
        <p className="text-white text-sm">Amazing photo collection 📸</p>
        {track && (
          <div className="flex items-center gap-2 mt-2 bg-black/40 rounded-full px-2 py-1 w-fit">
            <Music className="w-3 h-3 text-white" />
            <span className="text-white text-xs truncate max-w-[150px]">
              {track.name}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#212121] flex items-center justify-around px-4 z-10">
        <div className="flex flex-col items-center">
          <Home className="w-6 h-6 text-white" />
          <span className="text-white text-[10px]">Home</span>
        </div>
        <div className="flex flex-col items-center">
          <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25z"/>
          </svg>
          <span className="text-white/60 text-[10px]">Shorts</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center -mt-4">
          <Plus className="w-6 h-6 text-black" />
        </div>
        <div className="flex flex-col items-center">
          <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
          </svg>
          <span className="text-white/60 text-[10px]">Subs</span>
        </div>
        <div className="flex flex-col items-center">
          <User className="w-6 h-6 text-white/60" />
          <span className="text-white/60 text-[10px]">You</span>
        </div>
      </div>
    </>
  );
}
