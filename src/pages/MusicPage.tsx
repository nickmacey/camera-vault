import { useNavigate } from "react-router-dom";
import { ArrowLeft, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MusicVideoCreator } from "@/components/MusicVideoCreator";
import { SpotifyConnect } from "@/components/SpotifyConnect";
import { FeatureNav } from "@/components/FeatureNav";

export default function MusicPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <Music className="w-6 h-6" />
                MUSIC VIDEOS
              </h1>
              <p className="text-sm text-muted-foreground">Create videos with your photos + Spotify</p>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Navigation */}
      <div className="py-4 border-b border-border bg-card/30">
        <FeatureNav />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              Your Photos. Your Music. Your Story.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect your Spotify account to create stunning music videos 
              using your best photos. Perfect for social media, memories, or just for fun.
            </p>
          </div>

          {/* Spotify Connection Card */}
          <div className="max-w-md mx-auto mb-8">
            <SpotifyConnect />
          </div>

          {/* Music Video Creator */}
          <MusicVideoCreator />
        </div>
      </main>
    </div>
  );
}
