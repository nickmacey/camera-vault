import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Typewriter hook
function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) return;
    
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isComplete };
}

// TypewriterText component with thin font
function TypewriterText({ text }: { text: string }) {
  const { displayedText, isComplete } = useTypewriter(text, 25);
  
  return (
    <div className="prose prose-invert max-w-none">
      <p 
        className="text-lg md:text-xl text-foreground/90 leading-relaxed italic"
        style={{ 
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 300,
          letterSpacing: '0.01em'
        }}
      >
        {displayedText}
        {!isComplete && (
          <span className="inline-block w-0.5 h-5 bg-vault-gold ml-1 animate-pulse" />
        )}
      </p>
    </div>
  );
}

export function StoryLensSection() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    first_name: string;
    avatar_url: string | null;
    lens_story: string | null;
    lens_profile: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('profiles')
        .select('first_name, avatar_url, lens_story, lens_profile')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateStory = async () => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-lens-profile');
      
      if (error) {
        toast.error('Failed to regenerate story', { description: error.message });
        return;
      }

      if (data?.lensProfile?.firstPersonStory) {
        setProfile(prev => prev ? {
          ...prev,
          lens_story: data.lensProfile.firstPersonStory,
          lens_profile: data.lensProfile
        } : null);
        toast.success('Your story has been refreshed');
      }
    } catch (err) {
      console.error('Regenerate error:', err);
      toast.error('Failed to regenerate story');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-vault-gold">Loading your story...</div>
      </div>
    );
  }

  const archetype = profile?.lens_profile?.archetype?.title;

  return (
    <div className="relative z-30 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Photo & Name */}
        <div className="flex flex-col items-center mb-8">
          {/* Display only - no upload button */}
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-vault-gold/30 shadow-xl">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-card flex items-center justify-center">
                <Eye className="w-12 h-12 text-vault-gold/30" />
              </div>
            )}
          </div>
          
          <h2 className="mt-6 text-4xl md:text-5xl font-display text-vault-gold text-center tracking-[0.2em]"
              style={{ textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}>
            {profile?.first_name ? `${profile.first_name.toUpperCase()}'S STORY` : 'MY STORY'}
          </h2>
          
          {archetype && (
            <p className="mt-2 text-lg text-foreground/70 italic tracking-wide">
              {archetype}
            </p>
          )}
        </div>

        {/* Through My Lens Story */}
        <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-vault-gold/20 p-8 md:p-12">
          <div className="flex items-center gap-2 mb-6">
            <Eye className="w-5 h-5 text-vault-gold" />
            <h3 className="text-xl font-display text-vault-gold tracking-wider">THROUGH MY LENS</h3>
          </div>

          {profile?.lens_story ? (
            <TypewriterText text={profile.lens_story} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Your story hasn't been written yet. Visit the Lens page to discover how you see the world.
              </p>
              <Button
                onClick={() => navigate('/app/lens')}
                className="bg-vault-gold text-vault-dark hover:bg-vault-gold/90"
              >
                <Eye className="w-4 h-4 mr-2" />
                Discover My Vision
              </Button>
            </div>
          )}

          {profile?.lens_story && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateStory}
                disabled={regenerating}
                className="border-vault-gold/30 text-vault-gold hover:bg-vault-gold/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Refreshing...' : 'Refresh Story'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
