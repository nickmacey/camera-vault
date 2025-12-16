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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
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

    const { coordinates } = await req.json();
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return new Response(JSON.stringify({ error: 'Invalid coordinates array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('VITE_GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured');
      return new Response(JSON.stringify({ error: 'Geocoding service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const uniqueLocations = new Set<string>();
    const results: string[] = [];

    // Process coordinates in batches to avoid rate limits
    for (const coord of coordinates.slice(0, 50)) { // Limit to 50 coordinates
      if (!coord.lat || !coord.lng) continue;
      
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${GOOGLE_MAPS_API_KEY}&result_type=locality|administrative_area_level_1|country`
        );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results?.length > 0) {
          const result = data.results[0];
          const components = result.address_components || [];
          
          // Extract city/locality and country
          let city = '';
          let country = '';
          
          for (const component of components) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            } else if (component.types.includes('country')) {
              country = component.long_name;
            }
          }
          
          // Prefer city, fallback to country
          const locationName = city || country;
          
          if (locationName && !uniqueLocations.has(locationName)) {
            uniqueLocations.add(locationName);
            results.push(locationName);
          }
        }
      } catch (err) {
        console.error('Error geocoding coordinate:', coord, err);
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('Reverse geocoded', coordinates.length, 'coordinates to', results.length, 'unique locations');

    return new Response(JSON.stringify({ locations: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Reverse geocode error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
