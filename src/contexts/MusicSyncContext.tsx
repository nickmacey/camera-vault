import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useSpotifyPlayer } from "./SpotifyPlayerContext";

interface MusicSyncState {
  // Sync modes
  syncEnabled: boolean;
  setSyncEnabled: (enabled: boolean) => void;
  
  // Animation speed multiplier (0.5 = slow, 1 = normal, 2 = fast)
  speedMultiplier: number;
  setSpeedMultiplier: (speed: number) => void;
  
  // Pulse with beat (for future BPM detection)
  pulseEnabled: boolean;
  setPulseEnabled: (enabled: boolean) => void;
  
  // Calculated values based on playback
  isPlaying: boolean;
  progress: number; // 0-1 playback progress
  
  // Helper: get adjusted duration based on sync settings
  getAdjustedDuration: (baseDuration: number) => number;
}

const MusicSyncContext = createContext<MusicSyncState | undefined>(undefined);

export function MusicSyncProvider({ children }: { children: React.ReactNode }) {
  const { isPlaying, position, currentTrack } = useSpotifyPlayer();
  
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [pulseEnabled, setPulseEnabled] = useState(false);
  
  // Calculate progress (0-1)
  const progress = useMemo(() => {
    if (!currentTrack?.duration || !position) return 0;
    return Math.min(position / currentTrack.duration, 1);
  }, [position, currentTrack?.duration]);
  
  // Get adjusted duration based on sync settings
  const getAdjustedDuration = useCallback((baseDuration: number) => {
    if (!syncEnabled) return baseDuration;
    
    // When music is playing, use speed multiplier
    // When paused, slow down animations
    if (isPlaying) {
      return baseDuration / speedMultiplier;
    } else {
      return baseDuration * 2; // Slow down when paused
    }
  }, [syncEnabled, isPlaying, speedMultiplier]);
  
  const value: MusicSyncState = {
    syncEnabled,
    setSyncEnabled,
    speedMultiplier,
    setSpeedMultiplier,
    pulseEnabled,
    setPulseEnabled,
    isPlaying: isPlaying || false,
    progress,
    getAdjustedDuration,
  };
  
  return (
    <MusicSyncContext.Provider value={value}>
      {children}
    </MusicSyncContext.Provider>
  );
}

export function useMusicSync() {
  const context = useContext(MusicSyncContext);
  if (!context) {
    throw new Error("useMusicSync must be used within a MusicSyncProvider");
  }
  return context;
}
