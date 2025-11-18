import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllProviders, getConnectableProviders } from "@/lib/providers/providerRegistry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface ProviderConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderConnectionModal({ open, onOpenChange }: ProviderConnectionModalProps) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);
  const allProviders = getAllProviders();
  const connectableProviders = getConnectableProviders();
  
  const handleConnect = async (providerId: string) => {
    if (providerId === 'google_photos') {
      try {
        console.log('🔵 Starting Google Photos connection...');
        
        // Get current user FIRST to avoid stuck "Connecting..." state
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔵 User check:', user ? 'Authenticated' : 'Not authenticated');
        
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to connect Google Photos",
            variant: "destructive"
          });
          setConnecting(null);
          return;
        }

        setConnecting(providerId);
        console.log('🔵 Set connecting state to:', providerId);

        // Fetch OAuth config from backend
        console.log('🔵 Fetching OAuth config...');
        const { data: config, error: configError } = await supabase.functions.invoke('google-oauth-config');
        console.log('🔵 OAuth config response:', { config, configError });
        
        if (configError || !config?.clientId) {
          console.error('❌ Failed to fetch OAuth config:', configError);
          toast({
            title: "Configuration Error",
            description: "Failed to load Google OAuth configuration. Please try again.",
            variant: "destructive"
          });
          setConnecting(null);
          return;
        }

        const { clientId, redirectUri } = config;
        console.log('🔵 Using OAuth config:', { clientId, redirectUri });

        // Store user ID and initiate OAuth
        sessionStorage.setItem('google_oauth_user_id', user.id);
        const state = crypto.randomUUID();
        sessionStorage.setItem('google_oauth_state', state);
        console.log('🔵 Stored session data, state:', state);

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
        console.log('🔵 Redirecting to Google OAuth:', authUrl);
        
        window.location.href = authUrl;
      } catch (error) {
        console.error('❌ Connection error:', error);
        toast({
          title: "Connection failed",
          description: error instanceof Error ? error.message : "Failed to connect to Google Photos",
          variant: "destructive"
        });
        setConnecting(null);
      }
    } else {
      toast({
        title: "Coming Soon",
        description: `${providerId} integration will be available in Phase 2`,
        variant: "default"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black border border-border/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-foreground">
            Connect Photo Sources
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Expand your vault by connecting external photo libraries
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Manual Upload - Always Connected */}
          <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📤</span>
                  <h3 className="text-lg font-medium text-foreground">Manual Upload</h3>
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload photos directly from your device
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>• 50MB max file size</span>
                  <span>• EXIF data support</span>
                  <span>• JPG, PNG, HEIC, WebP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connectable Providers */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Available Integrations</h4>
            <div className="space-y-3">
              {connectableProviders.map((provider) => {
                const caps = provider.getCapabilities();
                return (
                  <div 
                    key={provider.id}
                    className="border border-border/20 rounded-lg p-4 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{provider.icon}</span>
                          <h3 className="text-base font-medium text-foreground">{provider.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {provider.description}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {caps.maxFileSize && (
                            <span>• {Math.round(caps.maxFileSize / (1024 * 1024))}MB max</span>
                          )}
                          {caps.hasMetadata && <span>• Full EXIF data</span>}
                          {caps.hasLocation && <span>• Location data</span>}
                          {caps.rateLimit && (
                            <span>• {caps.rateLimit.toLocaleString()} requests/day</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(provider.id)}
                        disabled={connecting === provider.id}
                        className="ml-4"
                      >
                        {connecting === provider.id ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coming Soon Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Phase 2</h4>
            <p className="text-xs text-muted-foreground/70 mb-2">
              More integrations coming soon based on demand
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/20">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
