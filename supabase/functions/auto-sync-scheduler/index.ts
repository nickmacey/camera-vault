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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-sync scheduler...');

    // Get all providers with sync enabled
    const { data: providers, error: providersError } = await supabase
      .from('connected_providers')
      .select('*')
      .eq('sync_enabled', true)
      .eq('provider', 'google_photos');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
      throw providersError;
    }

    if (!providers || providers.length === 0) {
      console.log('No providers with auto-sync enabled');
      return new Response(
        JSON.stringify({ message: 'No providers to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${providers.length} providers with auto-sync enabled`);

    const syncResults = [];

    for (const provider of providers) {
      try {
        const now = new Date();
        const lastSync = provider.last_sync ? new Date(provider.last_sync) : null;
        
        // Check if sync is needed based on frequency
        let shouldSync = false;
        if (!lastSync) {
          shouldSync = true;
        } else {
          const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
          
          switch (provider.auto_sync_frequency) {
            case 'hourly':
              shouldSync = hoursSinceLastSync >= 1;
              break;
            case 'daily':
              shouldSync = hoursSinceLastSync >= 24;
              break;
            case 'weekly':
              shouldSync = hoursSinceLastSync >= 168;
              break;
            default:
              shouldSync = hoursSinceLastSync >= 24; // Default to daily
          }
        }

        if (!shouldSync) {
          console.log(`Skipping sync for provider ${provider.id} - last sync was too recent`);
          syncResults.push({
            provider_id: provider.id,
            user_id: provider.user_id,
            status: 'skipped',
            reason: 'too_recent'
          });
          continue;
        }

        // Create a new sync job
        const { data: syncJob, error: syncJobError } = await supabase
          .from('sync_jobs')
          .insert({
            user_id: provider.user_id,
            provider_id: provider.id,
            status: 'pending',
            filters: provider.settings || {}
          })
          .select()
          .single();

        if (syncJobError) {
          console.error(`Error creating sync job for provider ${provider.id}:`, syncJobError);
          syncResults.push({
            provider_id: provider.id,
            user_id: provider.user_id,
            status: 'error',
            error: syncJobError.message
          });
          continue;
        }

        console.log(`Created sync job ${syncJob.id} for provider ${provider.id}`);

        // Trigger the sync function asynchronously
        fetch(`${supabaseUrl}/functions/v1/google-photos-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ syncJobId: syncJob.id })
        }).catch(err => {
          console.error(`Error triggering sync for job ${syncJob.id}:`, err);
        });

        syncResults.push({
          provider_id: provider.id,
          user_id: provider.user_id,
          sync_job_id: syncJob.id,
          status: 'triggered'
        });

      } catch (err) {
        console.error(`Error processing provider ${provider.id}:`, err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        syncResults.push({
          provider_id: provider.id,
          user_id: provider.user_id,
          status: 'error',
          error: errorMessage
        });
      }
    }

    console.log('Auto-sync scheduler completed:', syncResults);

    return new Response(
      JSON.stringify({
        message: 'Auto-sync completed',
        results: syncResults,
        total: providers.length,
        triggered: syncResults.filter(r => r.status === 'triggered').length,
        skipped: syncResults.filter(r => r.status === 'skipped').length,
        errors: syncResults.filter(r => r.status === 'error').length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Auto-sync scheduler error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
