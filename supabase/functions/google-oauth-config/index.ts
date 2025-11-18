import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Prefer GOOGLE_CLIENT_ID; fallback to VITE_GOOGLE_CLIENT_ID for compatibility
    const candidates = [
      Deno.env.get('GOOGLE_CLIENT_ID') || '',
      Deno.env.get('VITE_GOOGLE_CLIENT_ID') || ''
    ].filter(Boolean);

    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    // Helper validations
    const isClientSecret = (val: string) => /^GOCSPX-/.test(val);
    const isClientId = (val: string) => /\.apps\.googleusercontent\.com$/.test(val);

    const validId = candidates.find(isClientId);
    const provided = candidates[0] || '';

    if (!validId) {
      const looksLikeSecret = provided && isClientSecret(provided);
      const msg = looksLikeSecret
        ? 'Configured value looks like a Google Client Secret. Please provide the Client ID ending with .apps.googleusercontent.com.'
        : 'Google Client ID not configured or invalid.';

      return new Response(
        JSON.stringify({ error: 'invalid_client_id', message: msg }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        clientId: validId,
        redirectUri: redirectUri || `${req.headers.get('origin')}/auth/google/callback`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in google-oauth-config:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
