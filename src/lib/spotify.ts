import { supabase } from "@/integrations/supabase/client";

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
console.log('[Spotify] Client ID configured:', !!SPOTIFY_CLIENT_ID);
const REDIRECT_URI = `https://erdsngxlqyhhayzekgid.supabase.co/functions/v1/spotify-oauth-callback`;
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

export async function initiateSpotifyOAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to connect Spotify');
  }

  // Use user ID as state for callback
  const state = user.id;
  
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID || '');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('show_dialog', 'true');

  window.location.href = authUrl.toString();
}

export async function getSpotifyConnection() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('connected_providers')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'spotify')
    .maybeSingle();

  if (error) {
    console.error('Error fetching Spotify connection:', error);
    return null;
  }

  return data;
}

export async function disconnectSpotify() {
  const { data, error } = await supabase.functions.invoke('spotify-api', {
    body: { action: 'disconnect' },
  });

  if (error) throw error;
  return data;
}

export async function getPlaylists() {
  const { data, error } = await supabase.functions.invoke('spotify-api', {
    body: { action: 'get_playlists' },
  });

  if (error) throw error;
  return data;
}

export async function getLikedSongs() {
  const { data, error } = await supabase.functions.invoke('spotify-api', {
    body: { action: 'get_liked_songs' },
  });

  if (error) throw error;
  return data;
}

export async function getPlaylistTracks(playlistId: string) {
  const { data, error } = await supabase.functions.invoke('spotify-api', {
    body: { action: 'get_playlist_tracks', playlistId },
  });

  if (error) throw error;
  return data;
}

export async function searchTracks(query: string) {
  const { data, error } = await supabase.functions.invoke('spotify-api', {
    body: { action: 'search', query, type: 'track' },
  });

  if (error) throw error;
  return data;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: {
    total: number;
  };
}
