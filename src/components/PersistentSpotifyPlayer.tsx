import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PersistentSpotifyPlayer() {
  const { currentTrack, setCurrentTrack } = useSpotifyPlayer();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on the music page since it has its own player
  const isOnMusicPage = location.pathname === "/app/music";

  // Don't render if no track or on music page
  if (!currentTrack || isOnMusicPage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-[#282828] rounded-2xl shadow-2xl border border-border/30 overflow-hidden animate-fade-in">
      {/* Close button */}
      <button
        onClick={() => setCurrentTrack(null)}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
      >
        <X className="w-3 h-3 text-white" />
      </button>

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

      {/* Spotify Embed - Compact */}
      <iframe
        src={`https://open.spotify.com/embed/track/${currentTrack.id}?utm_source=generator&theme=0`}
        width="280"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-b-xl"
      />
    </div>
  );
}
