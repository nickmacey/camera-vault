import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Music, ChevronDown, ChevronUp, Play, Pause, Volume2 } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export function PersistentSpotifyPlayer() {
  const { 
    isReady, 
    isPlaying, 
    currentTrack, 
    selectedTrack,
    setSelectedTrack,
    togglePlay,
    position,
    setVolume
  } = useSpotifyPlayer();
  
  const location = useLocation();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [volumeValue, setVolumeValue] = useState(50);

  // Use SDK currentTrack if available, otherwise fall back to selectedTrack
  const displayTrack = currentTrack || (selectedTrack ? {
    id: selectedTrack.id,
    name: selectedTrack.name,
    artists: selectedTrack.artists?.map(a => a.name).join(", ") || "",
    albumArt: selectedTrack.album?.images?.[0]?.url || "",
    duration: selectedTrack.duration_ms || 0,
  } : null);

  // Don't render if no track selected and SDK has no current track
  if (!displayTrack && !selectedTrack) {
    return null;
  }

  // On music page, show compact bar at bottom
  const isOnMusicPage = location.pathname === "/app/music";

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolumeValue(vol);
    setVolume(vol / 100);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If SDK is ready and we have a current track from SDK
  if (isReady && currentTrack) {
    if (isOnMusicPage) {
      // Compact bar at bottom on music page
      return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#181818] border-t border-[#282828]">
          <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {currentTrack.albumArt && (
                <img 
                  src={currentTrack.albumArt} 
                  alt={currentTrack.name}
                  className="w-14 h-14 rounded shadow-lg"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentTrack.name}</p>
                <p className="text-xs text-white/60 truncate">{currentTrack.artists}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-black" fill="black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                )}
              </button>
              
              {/* Progress */}
              <div className="hidden md:flex items-center gap-2 text-xs text-white/60">
                <span>{formatTime(position)}</span>
                <div className="w-32 h-1 bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-[#1DB954] rounded-full"
                    style={{ width: `${(position / currentTrack.duration) * 100}%` }}
                  />
                </div>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="relative">
                <button 
                  onClick={() => setShowVolume(!showVolume)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-white/60" />
                </button>
                {showVolume && (
                  <div className="absolute bottom-full right-0 mb-2 p-3 bg-[#282828] rounded-lg shadow-xl">
                    <Slider
                      value={[volumeValue]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Floating mini player on other pages
    return (
      <div className={`fixed bottom-4 left-4 z-50 bg-[#181818] rounded-2xl shadow-2xl border border-[#282828] overflow-hidden animate-fade-in transition-all ${isMinimized ? 'w-14 h-14' : 'w-72'}`}>
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center hover:bg-white/10 transition-colors relative"
          >
            {currentTrack.albumArt ? (
              <img 
                src={currentTrack.albumArt} 
                alt={currentTrack.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <Music className="w-6 h-6 text-[#1DB954]" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-[#1DB954] animate-pulse" />
                  <div className="w-1 h-4 bg-[#1DB954] animate-pulse delay-75" />
                  <div className="w-1 h-2 bg-[#1DB954] animate-pulse delay-150" />
                </div>
              </div>
            )}
          </button>
        ) : (
          <>
            {/* Controls */}
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
              >
                <ChevronDown className="w-3 h-3 text-white" />
              </button>
              <button
                onClick={() => setSelectedTrack(null)}
                className="p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>

            {/* Track Info */}
            <div 
              onClick={() => navigate("/app/music")}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors"
            >
              {currentTrack.albumArt ? (
                <img 
                  src={currentTrack.albumArt} 
                  alt={currentTrack.name}
                  className="w-12 h-12 rounded shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-[#282828] flex items-center justify-center">
                  <Music className="w-5 h-5 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentTrack.name}</p>
                <p className="text-xs text-white/60 truncate">{currentTrack.artists}</p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="px-3 pb-3">
              {/* Progress Bar */}
              <div className="flex items-center gap-2 text-[10px] text-white/40 mb-2">
                <span>{formatTime(position)}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full">
                  <div 
                    className="h-full bg-[#1DB954] rounded-full transition-all"
                    style={{ width: `${(position / currentTrack.duration) * 100}%` }}
                  />
                </div>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>

              {/* Play/Pause Button */}
              <div className="flex justify-center">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-black" fill="black" />
                  ) : (
                    <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Fallback to embed if SDK not ready but track is selected
  if (selectedTrack && !isReady) {
    if (isOnMusicPage) {
      return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#282828] border-t border-border/30">
          <div className="text-center py-2 text-xs text-white/60">
            Connecting to Spotify... {selectedTrack.name}
          </div>
          <iframe
            key={selectedTrack.id}
            src={`https://open.spotify.com/embed/track/${selectedTrack.id}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div className={`fixed bottom-4 left-4 z-50 bg-[#282828] rounded-2xl shadow-2xl border border-border/30 overflow-hidden animate-fade-in ${isMinimized ? 'w-14 h-14' : ''}`}>
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {selectedTrack.album?.images?.[0]?.url ? (
              <img 
                src={selectedTrack.album.images[0].url} 
                alt={selectedTrack.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <Music className="w-6 h-6 text-[#1DB954]" />
            )}
          </button>
        ) : (
          <>
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
              >
                <ChevronDown className="w-3 h-3 text-white" />
              </button>
              <button
                onClick={() => setSelectedTrack(null)}
                className="p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
            <div 
              onClick={() => navigate("/app/music")}
              className="flex items-center gap-2 px-3 pt-2 pb-1 cursor-pointer hover:bg-white/5"
            >
              {selectedTrack.album?.images?.[0]?.url && (
                <img src={selectedTrack.album.images[0].url} alt="" className="w-8 h-8 rounded" />
              )}
              <div className="flex-1 min-w-0 max-w-[180px]">
                <p className="text-xs font-medium text-white truncate">{selectedTrack.name}</p>
                <p className="text-[10px] text-white/60 truncate">
                  {selectedTrack.artists?.map(a => a.name).join(", ")}
                </p>
              </div>
            </div>
            <iframe
              key={selectedTrack.id}
              src={`https://open.spotify.com/embed/track/${selectedTrack.id}?utm_source=generator&theme=0`}
              width="280"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-b-xl"
            />
          </>
        )}
      </div>
    );
  }

  return null;
}
