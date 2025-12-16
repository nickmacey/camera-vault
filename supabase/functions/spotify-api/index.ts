import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshSpotifyToken(supabase: any, userId: string, refreshToken: string) {
  const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
  const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Spotify token');
  }

  const tokens = await response.json();
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from('connected_providers')
    .update({
      access_token: tokens.access_token,
      token_expiry: tokenExpiry,
      ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
    })
    .eq('user_id', userId)
    .eq('provider', 'spotify');

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for token operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...params } = await req.json();
    console.log('Spotify API action:', action);

    // Get Spotify connection
    const { data: connection, error: connError } = await supabaseService
      .from('connected_providers')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'spotify')
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'Spotify not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    const tokenExpiry = new Date(connection.token_expiry);
    if (tokenExpiry < new Date()) {
      console.log('Refreshing Spotify token...');
      accessToken = await refreshSpotifyToken(supabaseService, user.id, connection.refresh_token);
    }

    let result;

    switch (action) {
      case 'get_playlists': {
        const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        result = await response.json();
        break;
      }

      case 'get_liked_songs': {
        const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        result = await response.json();
        break;
      }

      case 'get_playlist_tracks': {
        const { playlistId } = params;
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        result = await response.json();
        break;
      }

      case 'get_track': {
        const { trackId } = params;
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        result = await response.json();
        break;
      }

      case 'search': {
        const { query, type = 'track' } = params;
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        result = await response.json();
        break;
      }

      case 'get_popular_tracks': {
        // Try multiple search queries to find tracks with preview URLs
        const searchQueries = [
          'genre:pop year:2024',
          'genre:electronic',
          'genre:indie',
          'genre:hip-hop',
          'viral hits'
        ];
        
        const allTracks: any[] = [];
        
        for (const query of searchQueries) {
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          );
          const searchResult = await searchResponse.json();
          
          const tracksWithPreviews = (searchResult.tracks?.items || [])
            .filter((track: any) => track.preview_url);
          
          allTracks.push(...tracksWithPreviews);
          
          // Stop if we have enough tracks
          if (allTracks.length >= 30) break;
        }
        
        // Deduplicate by track ID
        const uniqueTracks = Array.from(
          new Map(allTracks.map((track: any) => [track.id, track])).values()
        ).slice(0, 30);
        
        console.log(`Found ${uniqueTracks.length} tracks with preview URLs`);
        
        result = { items: uniqueTracks.map((track: any) => ({ track })) };
        break;
      }

      case 'disconnect': {
        await supabaseService
          .from('connected_providers')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'spotify');
        result = { success: true };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Spotify API error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
