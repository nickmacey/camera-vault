import { supabase } from '@/integrations/supabase/client';

export interface ImportFilters {
  excludeScreenshots: boolean;
  minFileSize: number;
  onlyCamera: boolean;
  dateRange: 'all' | 'last_year' | 'last_5_years' | 'custom';
  customStart?: Date;
  customEnd?: Date;
}

/**
 * Initiates the Google Photos OAuth flow by redirecting to Google's consent screen
 */
export async function initiateGooglePhotosOAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  
  if (!clientId) {
    throw new Error('Google OAuth not configured');
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem('google_oauth_state', state);

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  // Redirect to Google
  window.location.href = authUrl;
}

/**
 * Handles the OAuth callback after Google redirects back to the app
 * Exchanges the authorization code for tokens via Edge Function (secure!)\\
 */
export async function handleGooglePhotosCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  // Handle errors
  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!code || !state) {
    throw new Error('Missing OAuth parameters');
  }

  // Verify state (CSRF protection)
  const savedState = sessionStorage.getItem('google_oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }
  sessionStorage.removeItem('google_oauth_state');

  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Exchange code for tokens via Edge Function (secure!)\\
  // Client secret never leaves the server
  const { data, error: exchangeError } = await supabase.functions.invoke('google-oauth-exchange', {
    body: {
      action: 'exchange',
      code,
      userId: session.user.id
    }
  });

  if (exchangeError) {
    throw exchangeError;
  }

  return data;
}

/**
 * Gets the connected Google Photos provider for the current user
 */
export async function getGooglePhotosProvider() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('connected_providers')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google_photos')
    .single();

  if (error) return null;
  return data;
}

/**
 * Disconnects Google Photos by removing the provider connection
 */
export async function disconnectGooglePhotos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('connected_providers')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google_photos');

  if (error) throw error;
}

/**
 * Starts a Google Photos sync job with the specified filters
 * The sync runs in the background via Edge Function
 */
export async function startGooglePhotosSync(filters: ImportFilters) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const provider = await getGooglePhotosProvider();
  if (!provider) throw new Error('Google Photos not connected');

  // Create sync job
  const { data: syncJob, error } = await supabase
    .from('sync_jobs')
    .insert({
      user_id: user.id,
      provider_id: provider.id,
      status: 'pending',
      filters: filters as any
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger background sync via Edge Function
  const { error: syncError } = await supabase.functions.invoke('google-photos-sync', {
    body: { syncJobId: syncJob.id }
  });

  if (syncError) {
    // Clean up sync job if Edge Function call failed
    await supabase.from('sync_jobs').delete().eq('id', syncJob.id);
    throw syncError;
  }

  return syncJob;
}

/**
 * Gets all sync jobs for the current user
 */
export async function getSyncJobs() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('sync_jobs')
    .select('*, provider:connected_providers(display_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch sync jobs:', error);
    return [];
  }

  return data;
}

/**
 * Gets a specific sync job by ID
 */
export async function getSyncJob(jobId: string) {
  const { data, error } = await supabase
    .from('sync_jobs')
    .select('*, provider:connected_providers(display_name)')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Pauses a running sync job
 */
export async function pauseSyncJob(jobId: string) {
  const { error } = await supabase
    .from('sync_jobs')
    .update({ status: 'paused' })
    .eq('id', jobId);

  if (error) throw error;
}

/**
 * Resumes a paused sync job
 */
export async function resumeSyncJob(jobId: string) {
  const { error } = await supabase
    .from('sync_jobs')
    .update({ status: 'running' })
    .eq('id', jobId);

  if (error) throw error;

  // Restart the Edge Function
  const { error: syncError } = await supabase.functions.invoke('google-photos-sync', {
    body: { syncJobId: jobId }
  });

  if (syncError) throw syncError;
}

/**
 * Gets estimated photo count from Google Photos (requires active connection)
 */
export async function getGooglePhotosCount(): Promise<number> {
  const provider = await getGooglePhotosProvider();
  if (!provider) return 0;

  // Return stored count if available
  if (provider.photo_count > 0) {
    return provider.photo_count;
  }

  // Otherwise return a placeholder
  // In a real implementation, you'd call Google Photos API to get the actual count
  return 0;
}
