import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Music, Unlink, Check, ExternalLink, RefreshCw } from "lucide-react";
import { 
  initiateSpotifyOAuth, 
  getSpotifyConnection, 
  disconnectSpotify 
} from "@/lib/spotify";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";

export function SpotifyConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  const { isReady: sdkReady } = useSpotifyPlayer();

  useEffect(() => {
    checkConnection();
    
    // Check URL params for OAuth callback status
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify_connected') === 'true') {
      toast.success('Spotify connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      checkConnection();
    } else if (params.get('spotify_error')) {
      const error = params.get('spotify_error');
      toast.error('Spotify connection failed', { description: error });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnection = async () => {
    try {
      const connection = await getSpotifyConnection();
      if (connection) {
        setIsConnected(true);
        setDisplayName(connection.display_name);
      } else {
        setIsConnected(false);
        setDisplayName(null);
      }
    } catch (err) {
      console.error('Error checking Spotify connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await initiateSpotifyOAuth();
    } catch (err) {
      toast.error('Failed to connect', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectSpotify();
      setIsConnected(false);
      setDisplayName(null);
      toast.success('Spotify disconnected');
    } catch (err) {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="py-6">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-[#1DB954]" />
          Spotify
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/30">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                {displayName && (
                  <span className="text-sm text-muted-foreground">
                    as {displayName}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Unlink className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
            
            {!sdkReady && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Reconnect to enable continuous playback
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="text-[#1DB954] border-[#1DB954]/50 hover:bg-[#1DB954]/10"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${connecting ? 'animate-spin' : ''}`} />
                  Reconnect
                </Button>
              </div>
            )}
            
            {sdkReady && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  SDK Ready
                </Badge>
                <span className="text-xs text-muted-foreground">Continuous playback enabled</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Connect to create music videos with your playlists
            </p>
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black"
            >
              {connecting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Connect Spotify
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
