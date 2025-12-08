import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Music, Unlink, Check, ExternalLink } from "lucide-react";
import { 
  initiateSpotifyOAuth, 
  getSpotifyConnection, 
  disconnectSpotify 
} from "@/lib/spotify";

export function SpotifyConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connection = await getSpotifyConnection();
      if (connection) {
        setIsConnected(true);
        setDisplayName(connection.display_name);
      }
    } catch (err) {
      console.error('Error checking Spotify connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await initiateSpotifyOAuth();
    } catch (err) {
      toast.error('Failed to connect', { 
        description: err instanceof Error ? err.message : 'Unknown error' 
      });
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
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Connect to create music videos with your playlists
            </p>
            <Button
              onClick={handleConnect}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Spotify
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
