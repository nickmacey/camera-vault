import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Music, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function PersistentSpotifyPlayer() {
  const { currentTrack, setCurrentTrack } = useSpotifyPlayer();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  // Don't render if no track selected
  if (!currentTrack) {
    return null;
  }

  // On music page, show minimized version at top
  const isOnMusicPage = location.pathname === "/app/music";

  if (isOnMusicPage) {
    // On music page - show compact bar at bottom that doesn't interfere with the page's own UI
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#282828] border-t border-border/30">
        <iframe
          key={currentTrack.id}
          src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }

  // On other pages - show floating mini player
  return (
    <div className={`fixed bottom-4 left-4 z-50 bg-[#282828] rounded-2xl shadow-2xl border border-border/30 overflow-hidden animate-fade-in transition-all ${isMinimized ? 'w-14 h-14' : ''}`}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          {currentTrack.album?.images?.[0]?.url ? (
            <img 
              src={currentTrack.album.images[0].url} 
              alt={currentTrack.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <Music className="w-6 h-6 text-[#1DB954]" />
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
              onClick={() => setCurrentTrack(null)}
              className="p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Mini player info */}
          <div 
            onClick={() => navigate("/app/music")}
            className="flex items-center gap-2 px-3 pt-2 pb-1 cursor-pointer hover:bg-white/5 transition-colors"
          >
            {currentTrack.album?.images?.[0]?.url ? (
              <img 
                src={currentTrack.album.images[0].url} 
                alt={currentTrack.name}
                className="w-8 h-8 rounded"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <Music className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 max-w-[180px]">
              <p className="text-xs font-medium text-white truncate">{currentTrack.name}</p>
              <p className="text-[10px] text-white/60 truncate">
                {currentTrack.artists?.map(a => a.name).join(", ")}
              </p>
            </div>
          </div>

          {/* Spotify Embed */}
          <iframe
            key={currentTrack.id}
            src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
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
