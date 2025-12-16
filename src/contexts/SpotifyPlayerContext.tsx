import { createContext, useContext, useState, ReactNode } from "react";
import { SpotifyTrack } from "@/lib/spotify";

interface SpotifyPlayerContextType {
  currentTrack: SpotifyTrack | null;
  setCurrentTrack: (track: SpotifyTrack | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | undefined>(undefined);

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <SpotifyPlayerContext.Provider value={{ currentTrack, setCurrentTrack, isPlaying, setIsPlaying }}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error("useSpotifyPlayer must be used within a SpotifyPlayerProvider");
  }
  return context;
}
