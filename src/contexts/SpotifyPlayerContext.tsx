import React, { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { useSpotifyWebPlayback, SpotifyWebPlaybackState } from "@/hooks/useSpotifyWebPlayback";
import { SpotifyTrack } from "@/lib/spotify";

interface SpotifyPlayerContextType extends SpotifyWebPlaybackState {
  // Legacy track selection (for UI purposes)
  selectedTrack: SpotifyTrack | null;
  setSelectedTrack: (track: SpotifyTrack | null) => void;
  // SDK controls
  play: (spotifyUri: string) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  disconnect: () => void;
  // Helper to play a track object
  playTrack: (track: SpotifyTrack) => void;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | undefined>(undefined);

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const webPlayback = useSpotifyWebPlayback();
  const [selectedTrack, setSelectedTrackState] = useState<SpotifyTrack | null>(null);

  const playTrack = useCallback((track: SpotifyTrack) => {
    setSelectedTrackState(track);
    if (webPlayback.isReady && track.uri) {
      webPlayback.play(track.uri);
    }
  }, [webPlayback]);

  const setSelectedTrack = useCallback((track: SpotifyTrack | null) => {
    setSelectedTrackState(track);
    if (track && webPlayback.isReady && track.uri) {
      webPlayback.play(track.uri);
    }
  }, [webPlayback]);

  return (
    <SpotifyPlayerContext.Provider value={{ 
      ...webPlayback,
      selectedTrack,
      setSelectedTrack,
      playTrack,
    }}>
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
