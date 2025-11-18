import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generic error messages to avoid information leakage
const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid request parameters',
  SYNC_FAILED: 'Photo sync failed',
  UNAUTHORIZED: 'Authentication required',
  NOT_FOUND: 'Sync job not found',
};

// Validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated client to verify JWT
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user from token:', userError);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Invalid JSON body');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { syncJobId } = body;

    // Validate syncJobId
    if (!syncJobId || typeof syncJobId !== 'string' || !isValidUUID(syncJobId)) {
      console.error('Invalid syncJobId:', syncJobId);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_INPUT }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting sync for job:', syncJobId);

    // Get sync job and verify it belongs to the authenticated user
    const { data: syncJob, error: jobError } = await supabase
      .from('sync_jobs')
      .select('*, provider:connected_providers(*)')
      .eq('id', syncJobId)
      .eq('user_id', user.id)  // Verify ownership
      .single();

    if (jobError || !syncJob) {
      console.error('Failed to fetch sync job or unauthorized:', jobError);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_FOUND }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update to running
    await supabase
      .from('sync_jobs')
      .update({ status: 'running' })
      .eq('id', syncJobId);

    // Get access token
    let accessToken = syncJob.provider.access_token;
    
    // Check if token expired
    if (new Date(syncJob.provider.token_expiry) < new Date()) {
      console.log('Refreshing expired token');
      // Refresh token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: syncJob.provider.refresh_token,
          client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
          grant_type: 'refresh_token'
        })
      });

      if (!refreshResponse.ok) {
        const error = await refreshResponse.text();
        console.error('Token refresh failed:', error);
        throw new Error('Token refresh failed');
      }

      const newTokens = await refreshResponse.json();
      accessToken = newTokens.access_token;

      // Update token in database
      await supabase
        .from('connected_providers')
        .update({
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        })
        .eq('id', syncJob.provider.id);
    }

    // Fetch photos from Google Photos API
    let pageToken: string | undefined = undefined;
    let totalProcessed = 0;
    let vaultWorthyFound = 0;
    let highValueFound = 0;
    let archivedFound = 0;

    const filters = syncJob.filters || {};

    while (true) {
      console.log(`Fetching page ${pageToken ? `(${pageToken})` : '(first)'}`);
      
      const response: Response = await fetch(
        `https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50${pageToken ? `&pageToken=${pageToken}` : ''}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Photos API error:', error);
        throw new Error('Failed to fetch photos from Google');
      }

      const data: any = await response.json();
      
      if (!data.mediaItems || data.mediaItems.length === 0) break;

      console.log(`Processing ${data.mediaItems.length} items`);

      // Process each photo
      for (const item of data.mediaItems) {
        // Apply filters
        if (filters.excludeScreenshots && item.filename?.toLowerCase().includes('screenshot')) {
          continue;
        }

        const metadata = item.mediaMetadata;
        if (filters.onlyCamera && !metadata?.photo) {
          continue;
        }

        // Check if already exists
        const { data: existing } = await supabase
          .from('photos')
          .select('id')
          .eq('user_id', syncJob.user_id)
          .eq('provider', 'google_photos')
          .eq('external_id', item.id)
          .single();

        if (existing) {
          totalProcessed++;
          continue; // Skip if already analyzed
        }

        try {
          // Download photo for analysis (use smaller size for efficiency)
          const imageUrl = `${item.baseUrl}=w2048`;
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            console.error(`Failed to download image ${item.id}`);
            continue;
          }

          const imageBlob = await imageResponse.blob();
          const imageBuffer = await imageBlob.arrayBuffer();
          const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

          // Get user settings
          const { data: settings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', syncJob.user_id)
            .single();

          const userSettings = settings || {
            technical_weight: 70,
            commercial_weight: 80,
            artistic_weight: 60,
            emotional_weight: 50
          };

          // Analyze with Claude
          const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-5',
              max_tokens: 1024,
              messages: [{
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: item.mimeType,
                      data: base64Image
                    }
                  },
                  {
                    type: 'text',
                    text: `Analyze this photograph and provide scores from 0-10.

Respond ONLY with valid JSON (no markdown):
{
  "technical": 8.5,
  "commercial": 7.2,
  "artistic": 9.1,
  "emotional": 8.8,
  "analysis": "Brief commentary on the image"
}`
                  }
                ]
              }]
            })
          });

          if (!analysisResponse.ok) {
            const error = await analysisResponse.text();
            console.error(`Analysis failed for ${item.id}:`, error);
            continue;
          }

          const analysisData = await analysisResponse.json();
          let responseText = analysisData.content[0].text;
          responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const scores = JSON.parse(responseText);

          // Calculate weighted overall score
          const totalWeight = 
            userSettings.technical_weight +
            userSettings.commercial_weight +
            userSettings.artistic_weight +
            userSettings.emotional_weight;

          const overall = (
            (scores.technical * userSettings.technical_weight) +
            (scores.commercial * userSettings.commercial_weight) +
            (scores.artistic * userSettings.artistic_weight) +
            (scores.emotional * userSettings.emotional_weight)
          ) / totalWeight;

          const roundedOverall = parseFloat(overall.toFixed(1));
          const tier = roundedOverall >= 8.5 ? 'elite' 
                      : roundedOverall >= 7.0 ? 'stars' 
                      : 'archive';

          // Save to database
          await supabase.from('photos').insert({
            user_id: syncJob.user_id,
            provider: 'google_photos',
            external_id: item.id,
            source_url: item.productUrl,
            storage_path: imageUrl,
            filename: item.filename,
            mime_type: item.mimeType,
            width: metadata?.width,
            height: metadata?.height,
            orientation: (metadata?.width > metadata?.height) ? 'landscape' : 'portrait',
            date_taken: metadata?.creationTime,
            technical_score: scores.technical,
            commercial_score: scores.commercial,
            artistic_score: scores.artistic,
            emotional_score: scores.emotional,
            overall_score: roundedOverall,
            tier: tier,
            ai_analysis: scores.analysis,
            camera_data: metadata?.photo,
            location_data: metadata?.location,
            provider_metadata: item,
            analyzed_at: new Date().toISOString()
          });

          totalProcessed++;
          if (tier === 'elite') vaultWorthyFound++;
          else if (tier === 'stars') highValueFound++;
          else archivedFound++;

          console.log(`Processed ${item.filename}: ${tier} (${roundedOverall})`);

        } catch (error) {
          console.error(`Error processing photo ${item.id}:`, error);
          continue;
        }

        // Update progress
        await supabase
          .from('sync_jobs')
          .update({
            processed_photos: totalProcessed,
            vault_worthy_found: vaultWorthyFound,
            high_value_found: highValueFound,
            archived_found: archivedFound
          })
          .eq('id', syncJobId);

        // Rate limiting: 2 seconds per photo
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    // Mark as complete
    await supabase
      .from('sync_jobs')
      .update({ 
        status: 'complete',
        completed_at: new Date().toISOString(),
        processed_photos: totalProcessed,
        vault_worthy_found: vaultWorthyFound,
        high_value_found: highValueFound,
        archived_found: archivedFound
      })
      .eq('id', syncJobId);

    console.log(`Sync complete: ${totalProcessed} photos processed`);

    return new Response(
      JSON.stringify({ success: true, processed: totalProcessed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    
    // Try to update job status to failed (but don't expose detailed error)
    try {
      const authHeader = req.headers.get('Authorization');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      
      const body = await req.json().catch(() => ({}));
      const { syncJobId } = body;
      if (syncJobId && isValidUUID(syncJobId)) {
        await supabase
          .from('sync_jobs')
          .update({
            status: 'failed',
            error_message: 'Sync operation failed',
            last_error_at: new Date().toISOString()
          })
          .eq('id', syncJobId);
      }
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.SYNC_FAILED }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
