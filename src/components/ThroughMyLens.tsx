import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Eye, 
  Palette, 
  Heart, 
  BookOpen, 
  Sparkles, 
  RefreshCw,
  Camera
} from "lucide-react";

interface LensProfile {
  vision: string;
  visualSignature: {
    colorPalettes: string[];
    compositions: string[];
    lighting: string[];
    subjects: string[];
  };
  emotionalLandscape: string;
  stories: { theme: string; explanation: string }[];
  throughTheirEyes: string;
  archetype: {
    title: string;
    explanation: string;
  };
}

export function ThroughMyLens() {
  const [lensProfile, setLensProfile] = useState<LensProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyzeLensProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-lens-profile');
      
      if (error) {
        if (error.message?.includes('Not enough')) {
          toast.error('Need more photos', {
            description: 'Upload and analyze at least 3 photos to generate your lens profile',
          });
        } else {
          toast.error('Analysis failed', { description: error.message });
        }
        return;
      }

      if (data?.lensProfile) {
        setLensProfile(data.lensProfile);
        setHasAnalyzed(true);
        toast.success('Your lens profile is ready');
      }
    } catch (err) {
      console.error('Lens analysis error:', err);
      toast.error('Failed to analyze your photography');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-vault-gold">
            <Eye className="w-5 h-5" />
            Through My Lens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Analyzing your photography style...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnalyzed || !lensProfile) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-vault-gold">
            <Eye className="w-5 h-5" />
            Through My Lens
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">
            Discover how you see the world through your photography
          </p>
          <Button 
            onClick={analyzeLensProfile}
            className="bg-vault-gold text-vault-dark hover:bg-vault-gold/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Reveal My Vision
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Archetype Header */}
      <Card className="bg-gradient-to-br from-vault-gold/20 to-vault-gold/5 border-vault-gold/30">
        <CardContent className="pt-6 text-center">
          <h2 className="text-3xl font-bold text-vault-gold mb-2">
            {lensProfile.archetype?.title || 'The Visionary'}
          </h2>
          <p className="text-foreground/80 italic">
            {lensProfile.archetype?.explanation}
          </p>
        </CardContent>
      </Card>

      {/* The Vision */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-vault-gold">
            <Eye className="w-5 h-5" />
            The Vision
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
            {lensProfile.vision}
          </p>
        </CardContent>
      </Card>

      {/* Visual Signature */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-vault-gold">
            <Palette className="w-5 h-5" />
            Visual Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lensProfile.visualSignature?.colorPalettes?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Color Palettes</h4>
              <div className="flex flex-wrap gap-2">
                {lensProfile.visualSignature.colorPalettes.map((palette, i) => (
                  <Badge key={i} variant="secondary" className="bg-vault-gold/10 text-vault-gold border-vault-gold/30">
                    {palette}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {lensProfile.visualSignature?.compositions?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Compositions</h4>
              <div className="flex flex-wrap gap-2">
                {lensProfile.visualSignature.compositions.map((comp, i) => (
                  <Badge key={i} variant="outline">
                    {comp}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {lensProfile.visualSignature?.lighting?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Lighting</h4>
              <div className="flex flex-wrap gap-2">
                {lensProfile.visualSignature.lighting.map((light, i) => (
                  <Badge key={i} variant="outline">
                    {light}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {lensProfile.visualSignature?.subjects?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Subjects</h4>
              <div className="flex flex-wrap gap-2">
                {lensProfile.visualSignature.subjects.map((subject, i) => (
                  <Badge key={i} variant="outline">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotional Landscape */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-vault-gold">
            <Heart className="w-5 h-5" />
            Emotional Landscape
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
            {lensProfile.emotionalLandscape}
          </p>
        </CardContent>
      </Card>

      {/* Stories They Tell */}
      {lensProfile.stories?.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-vault-gold">
              <BookOpen className="w-5 h-5" />
              The Stories You Tell
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lensProfile.stories.map((story, i) => (
              <div key={i} className="border-l-2 border-vault-gold/50 pl-4">
                <h4 className="font-medium text-foreground">{story.theme}</h4>
                <p className="text-sm text-muted-foreground">{story.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Through Their Eyes */}
      <Card className="bg-gradient-to-br from-background to-vault-gold/5 border-vault-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-vault-gold">
            <Sparkles className="w-5 h-5" />
            Through Your Eyes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 leading-relaxed italic">
            {lensProfile.throughTheirEyes}
          </p>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={analyzeLensProfile}
          className="border-vault-gold/30 text-vault-gold hover:bg-vault-gold/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>
    </div>
  );
}
