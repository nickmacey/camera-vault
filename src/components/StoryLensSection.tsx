import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
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
          <ProfilePhotoUpload
            currentAvatarUrl={profile?.avatar_url}
            onUploadComplete={handleAvatarUpdate}
            size="lg"
          />
          
          <h2 className="mt-6 text-3xl md:text-4xl font-bold text-vault-gold text-center"
              style={{ textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}>
            {profile?.first_name ? `${profile.first_name.toUpperCase()}'S STORY` : 'MY STORY'}
          </h2>
          
          {archetype && (
            <p className="mt-2 text-lg text-foreground/70 italic">
              {archetype}
            </p>
          )}
        </div>

        {/* Through My Lens Story */}
        <div className="bg-card/40 backdrop-blur-sm rounded-2xl border border-vault-gold/20 p-8 md:p-12">
          <div className="flex items-center gap-2 mb-6">
            <Eye className="w-5 h-5 text-vault-gold" />
            <h3 className="text-xl font-semibold text-vault-gold">Through My Lens</h3>
          </div>

          {profile?.lens_story ? (
            <div className="prose prose-invert max-w-none">
              <p className="text-lg md:text-xl text-foreground/90 leading-relaxed whitespace-pre-line italic">
                {profile.lens_story}
              </p>
            </div>
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
