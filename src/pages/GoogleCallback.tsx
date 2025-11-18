import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Check for OAuth errors
      if (error) {
        setStatus('error');
        setError('Permission denied. Vault needs access to read your Google Photos library.');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError('Invalid callback parameters');
        return;
      }

      // Verify CSRF state
      const storedState = sessionStorage.getItem('google_oauth_state');
      const userId = sessionStorage.getItem('google_oauth_user_id');

      if (state !== storedState) {
        setStatus('error');
        setError('Invalid state parameter. Please try again.');
        return;
      }

      if (!userId) {
        setStatus('error');
        setError('User session not found. Please try again.');
        return;
      }

      // Exchange code for tokens via edge function
      const { data, error: exchangeError } = await supabase.functions.invoke('google-oauth-exchange', {
        body: {
          action: 'exchange',
          code,
          userId
        }
      });

      if (exchangeError) {
        console.error('Token exchange error:', exchangeError);
        setStatus('error');
        setError('Failed to connect to Google Photos. Please try again.');
        return;
      }

      // Clear session storage
      sessionStorage.removeItem('google_oauth_state');
      sessionStorage.removeItem('google_oauth_user_id');

      setStatus('success');

      // Redirect to import config after short delay
      setTimeout(() => {
        navigate('/?google_photos_connected=true');
      }, 1500);

    } catch (err) {
      console.error('Callback error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Connecting to Google Photos</h1>
            <p className="text-muted-foreground">Please wait while we set up your connection...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Connected Successfully</h1>
            <p className="text-muted-foreground">Redirecting to import configuration...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Connection Failed</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Vault
            </button>
          </>
        )}
      </div>
    </div>
  );
}
