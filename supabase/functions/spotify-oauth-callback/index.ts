import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('Spotify OAuth callback received:', { code: !!code, state, error });

    if (error) {
      console.error('Spotify OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${Deno.env.get('SITE_URL') || 'https://erdsngxlqyhhayzekgid.lovableproject.com'}/app?spotify_error=${encodeURIComponent(error)}`,
        },
      });
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'No authorization code provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
    const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const REDIRECT_URI = `https://erdsngxlqyhhayzekgid.supabase.co/functions/v1/spotify-oauth-callback`;

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('Missing Spotify credentials');
      return new Response(JSON.stringify({ error: 'Spotify credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Spotify token exchange failed:', errorText);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${Deno.env.get('SITE_URL') || 'https://erdsngxlqyhhayzekgid.lovableproject.com'}/app?spotify_error=token_exchange_failed`,
        },
      });
    }

    const tokens = await tokenResponse.json();
    console.log('Spotify tokens received successfully');

    // Get user profile from Spotify
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    const spotifyProfile = await profileResponse.json();
    console.log('Spotify profile fetched:', spotifyProfile.display_name);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from state (which contains user_id)
    const userId = state;
    if (!userId) {
      console.error('No user ID in state');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${Deno.env.get('SITE_URL') || 'https://erdsngxlqyhhayzekgid.lovableproject.com'}/app?spotify_error=no_user`,
        },
      });
    }

    // Store Spotify connection in connected_providers
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    
    const { error: upsertError } = await supabase
      .from('connected_providers')
      .upsert({
        user_id: userId,
        provider: 'spotify',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry,
        display_name: spotifyProfile.display_name || spotifyProfile.id,
        connected_at: new Date().toISOString(),
        settings: {
          spotify_id: spotifyProfile.id,
          spotify_email: spotifyProfile.email,
          spotify_country: spotifyProfile.country,
          spotify_product: spotifyProfile.product,
        },
      }, {
        onConflict: 'user_id,provider',
      });

    if (upsertError) {
      console.error('Failed to store Spotify connection:', upsertError);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${Deno.env.get('SITE_URL') || 'https://erdsngxlqyhhayzekgid.lovableproject.com'}/app?spotify_error=storage_failed`,
        },
      });
    }

    console.log('Spotify connection stored successfully for user:', userId);

    // Redirect back to app with success
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${Deno.env.get('SITE_URL') || 'https://erdsngxlqyhhayzekgid.lovableproject.com'}/app?spotify_connected=true`,
      },
    });

  } catch (err) {
    console.error('Spotify OAuth callback error:', err);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${Deno.env.get('SITE_URL') || 'https://erdsngxlqyhhayzekgid.lovableproject.com'}/app?spotify_error=unknown`,
      },
    });
  }
});
