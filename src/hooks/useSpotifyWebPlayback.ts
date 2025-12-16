import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (state: any) => void) => void;
  removeListener: (event: string) => void;
  getCurrentState: () => Promise<PlaybackState | null>;
  setName: (name: string) => Promise<void>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  activateElement: () => Promise<void>;
}

interface PlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
      artists: { name: string }[];
      album: {
        name: string;
        images: { url: string }[];
      };
    };
  };
}

export interface SpotifyWebPlaybackState {
  isReady: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentTrack: {
    id: string;
    name: string;
    artists: string;
    albumArt: string;
    duration: number;
  } | null;
  position: number;
  deviceId: string | null;
}

// Global state to track SDK loading
let sdkScriptLoaded = false;
let sdkReadyPromise: Promise<void> | null = null;
let sdkReadyResolve: (() => void) | null = null;

// Create a promise that resolves when SDK is ready
function waitForSpotifySDK(): Promise<void> {
  if (window.Spotify) {
    return Promise.resolve();
  }
  
  if (sdkReadyPromise) {
    return sdkReadyPromise;
  }
  
  sdkReadyPromise = new Promise((resolve) => {
    sdkReadyResolve = resolve;
  });
  
  return sdkReadyPromise;
}

// Load SDK script once globally
function loadSpotifySDK() {
  if (sdkScriptLoaded) return;
  
  sdkScriptLoaded = true;
  
  // Set up the callback before loading the script
  const existingCallback = window.onSpotifyWebPlaybackSDKReady;
  window.onSpotifyWebPlaybackSDKReady = () => {
    console.log("Spotify Web Playback SDK loaded");
    if (existingCallback) existingCallback();
    if (sdkReadyResolve) sdkReadyResolve();
  };
  
  const script = document.createElement("script");
  script.src = "https://sdk.scdn.co/spotify-player.js";
  script.async = true;
  document.body.appendChild(script);
}

export function useSpotifyWebPlayback() {
  const [state, setState] = useState<SpotifyWebPlaybackState>({
    isReady: false,
    isPlaying: false,
    isPaused: true,
    currentTrack: null,
    position: 0,
    deviceId: null,
  });
  
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const tokenRef = useRef<string | null>(null);
  const initializingRef = useRef(false);

  // Get access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("connected_providers")
        .select("access_token, token_expiry, refresh_token")
        .eq("user_id", user.id)
        .eq("provider", "spotify")
        .single();

      if (!data?.access_token) return null;

      // Check if token is expired and refresh if needed
      const expiry = new Date(data.token_expiry);
      if (expiry < new Date()) {
        // Token expired, refresh it
        const { data: refreshData, error } = await supabase.functions.invoke("spotify-api", {
          body: { action: "refresh_token" }
        });
        
        if (error || !refreshData?.access_token) {
          console.error("Failed to refresh token:", error);
          return null;
        }
        
        tokenRef.current = refreshData.access_token;
        return refreshData.access_token;
      }

      tokenRef.current = data.access_token;
      return data.access_token;
    } catch (err) {
      console.error("Error getting access token:", err);
      return null;
    }
  }, []);

  // Initialize player
  useEffect(() => {
    if (initializingRef.current || playerRef.current) return;
    
    const initPlayer = async () => {
      initializingRef.current = true;
      
      // First check if user has Spotify connected
      const token = await getAccessToken();
      if (!token) {
        console.log("No Spotify token available - user needs to connect Spotify");
        initializingRef.current = false;
        return;
      }

      // Load SDK script
      loadSpotifySDK();
      
      // Wait for SDK to be ready
      await waitForSpotifySDK();
      
      console.log("Creating Spotify player...");
      
      const player = new window.Spotify.Player({
        name: "VAULT Music Player",
        getOAuthToken: async (cb) => {
          const freshToken = await getAccessToken();
          if (freshToken) cb(freshToken);
        },
        volume: 0.5,
      });

      // Error handling
      player.addListener("initialization_error", ({ message }) => {
        console.error("Spotify init error:", message);
        toast.error("Spotify player initialization failed");
      });

      player.addListener("authentication_error", ({ message }) => {
        console.error("Spotify auth error:", message);
        toast.error("Spotify authentication failed. Please reconnect your account with new permissions.");
      });

      player.addListener("account_error", ({ message }) => {
        console.error("Spotify account error:", message);
        toast.error("Spotify Premium required for Web Playback");
      });

      player.addListener("playback_error", ({ message }) => {
        console.error("Spotify playback error:", message);
      });

      // Ready
      player.addListener("ready", ({ device_id }) => {
        console.log("Spotify Web Playback SDK ready with device ID:", device_id);
        setState(prev => ({ ...prev, isReady: true, deviceId: device_id }));
        toast.success("Spotify player connected!");
      });

      // Not Ready
      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID went offline:", device_id);
        setState(prev => ({ ...prev, isReady: false, deviceId: null }));
      });

      // Player state changed
      player.addListener("player_state_changed", (playerState) => {
        if (!playerState) {
          setState(prev => ({ ...prev, isPlaying: false, isPaused: true, currentTrack: null }));
          return;
        }

        const currentTrack = playerState.track_window.current_track;
        setState(prev => ({
          ...prev,
          isPlaying: !playerState.paused,
          isPaused: playerState.paused,
          position: playerState.position,
          currentTrack: currentTrack ? {
            id: currentTrack.id,
            name: currentTrack.name,
            artists: currentTrack.artists.map(a => a.name).join(", "),
            albumArt: currentTrack.album.images[0]?.url || "",
            duration: playerState.duration,
          } : null,
        }));
      });

      const success = await player.connect();
      if (success) {
        console.log("Spotify player connected successfully");
        playerRef.current = player;
      } else {
        console.error("Failed to connect Spotify player");
        toast.error("Failed to connect Spotify player");
      }
      
      initializingRef.current = false;
    };

    initPlayer();
  }, [getAccessToken]);

  // Play a track
  const play = useCallback(async (spotifyUri: string) => {
    if (!state.deviceId || !tokenRef.current) {
      toast.error("Player not ready. Please wait...");
      return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({
            uris: [spotifyUri],
          }),
        }
      );

      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        console.error("Play error:", error);
        toast.error("Failed to play track");
      }
    } catch (err) {
      console.error("Play error:", err);
      toast.error("Failed to play track");
    }
  }, [state.deviceId]);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    }
  }, []);

  // Pause
  const pause = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.pause();
    }
  }, []);

  // Resume
  const resume = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.resume();
    }
  }, []);

  // Seek
  const seek = useCallback(async (position_ms: number) => {
    if (playerRef.current) {
      await playerRef.current.seek(position_ms);
    }
  }, []);

  // Set volume
  const setVolume = useCallback(async (volume: number) => {
    if (playerRef.current) {
      await playerRef.current.setVolume(volume);
    }
  }, []);

  // Disconnect player (call when logging out)
  const disconnect = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current = null;
      setState({
        isReady: false,
        isPlaying: false,
        isPaused: true,
        currentTrack: null,
        position: 0,
        deviceId: null,
      });
    }
  }, []);

  return {
    ...state,
    play,
    togglePlay,
    pause,
    resume,
    seek,
    setVolume,
    disconnect,
  };
}
