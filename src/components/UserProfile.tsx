import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, LogOut, Shield, Image, Award, Star, Link as LinkIcon, Edit2, Save, X, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/imageOptimization";
import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters");
const avatarSchema = z.instanceof(File).refine((file) => file.size <= 5 * 1024 * 1024, "Avatar must be less than 5MB");

interface Profile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

interface ConnectedProvider {
  id: string;
  provider: string;
  display_name: string | null;
  photo_count: number | null;
  vault_worthy_count: number | null;
  analyzed_count: number | null;
  last_sync: string | null;
  sync_enabled: boolean | null;
}

interface PhotoStats {
  total: number;
  vault_worthy: number;
  top_10: number;
  favorites: number;
  avg_score: number;
}

export const UserProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [providers, setProviders] = useState<ConnectedProvider[]>([]);
  const [stats, setStats] = useState<PhotoStats>({
    total: 0,
    vault_worthy: 0,
    top_10: 0,
    favorites: 0,
    avg_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    first_name: "",
    last_name: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditedProfile({
          first_name: profileData.first_name,
          last_name: profileData.last_name || "",
        });
      }

      // Load connected providers
      const { data: providersData } = await supabase
        .from('connected_providers')
        .select('*')
        .eq('user_id', user.id);

      if (providersData) {
        setProviders(providersData);
      }

      // Load photo statistics
      const { data: photos } = await supabase
        .from('photos')
        .select('score, is_top_10, is_favorite, tier')
        .eq('user_id', user.id);

      if (photos) {
        const vaultWorthy = photos.filter(p => p.tier === 'vault_worthy').length;
        const top10 = photos.filter(p => p.is_top_10).length;
        const favorites = photos.filter(p => p.is_favorite).length;
        const avgScore = photos.length > 0
          ? photos.reduce((acc, p) => acc + (p.score || 0), 0) / photos.length
          : 0;

        setStats({
          total: photos.length,
          vault_worthy: vaultWorthy,
          top_10: top10,
          favorites,
          avg_score: avgScore,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      avatarSchema.parse(file);
      
      // Compress the image
      const compressed = await compressImage(file, { maxSizeMB: 0.5, maxWidthOrHeight: 400 });
      setAvatarFile(compressed);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid file",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process image",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate inputs
      nameSchema.parse(editedProfile.first_name);
      
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let avatarUrl = profile?.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        // Delete old avatar if exists
        if (profile?.avatar_url) {
          const oldPath = profile.avatar_url.split('/').pop();
          if (oldPath) {
            await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
          }
        }

        // Upload new avatar
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name || null,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Reload profile data
      await loadUserData();
      
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading profile...</div>;
  }

  const initials = profile 
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ''}`
    : "?";

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card className="border-2 border-vault-gold/20">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-vault-gold">
                    <AvatarImage src={avatarPreview || profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-vault-gold/20 text-vault-gold text-xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-vault-gold text-background rounded-full hover:bg-vault-gold/90 transition-colors shadow-lg"
                      aria-label="Upload avatar"
                    >
                      <Upload className="h-3 w-3" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                {isEditing ? (
                  <div className="flex-1 space-y-2 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="first_name" className="text-xs">First Name</Label>
                        <Input
                          id="first_name"
                          value={editedProfile.first_name}
                          onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                          placeholder="First name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="last_name" className="text-xs">Last Name</Label>
                        <Input
                          id="last_name"
                          value={editedProfile.last_name}
                          onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                          placeholder="Last name"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Mail className="h-3 w-3" />
                      <span className="break-all">{email}</span>
                    </CardDescription>
                  </div>
                ) : (
                  <div>
                    <CardTitle className="text-xl sm:text-2xl text-vault-gold">
                      {profile?.first_name} {profile?.last_name || ''}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs sm:text-sm break-all">{email}</span>
                    </CardDescription>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="border-border hover:bg-muted flex-1 sm:flex-none"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-vault-gold text-background hover:bg-vault-gold/90 flex-1 sm:flex-none"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-vault-gold/30 hover:bg-vault-gold/10 flex-1 sm:flex-none"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="border-vault-gold/30 hover:bg-vault-gold/10 flex-1 sm:flex-none"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Photo Statistics */}
      <Card className="border-2 border-vault-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-vault-gold">
            <Award className="h-5 w-5" />
            Your Photo Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-background/50 p-3 sm:p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs sm:text-sm">
                <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                Total Photos
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            </div>
            <div className="bg-background/50 p-3 sm:p-4 rounded-lg border border-vault-gold/30">
              <div className="flex items-center gap-2 text-vault-gold mb-1 text-xs sm:text-sm">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                Vault Worthy
              </div>
              <div className="text-xl sm:text-2xl font-bold text-vault-gold">{stats.vault_worthy}</div>
            </div>
            <div className="bg-background/50 p-3 sm:p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs sm:text-sm">
                <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                Top 10
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.top_10}</div>
            </div>
            <div className="bg-background/50 p-3 sm:p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs sm:text-sm">
                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                Favorites
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.favorites}</div>
            </div>
            <div className="bg-background/50 p-3 sm:p-4 rounded-lg border border-border col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs sm:text-sm">
                <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                Avg Score
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.avg_score.toFixed(1)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="border-2 border-vault-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-vault-gold">
            <LinkIcon className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Manage your connected photo providers and sync settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No accounts connected yet</p>
              <p className="text-xs mt-1">Connect Google Photos or upload manually</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div 
                  key={provider.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-background/50 rounded-lg border border-border hover:border-vault-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="h-10 w-10 rounded-full bg-vault-gold/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-vault-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground text-sm sm:text-base">
                        {provider.display_name || provider.provider}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {provider.photo_count || 0} photos • {provider.vault_worthy_count || 0} vault worthy
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Badge variant={provider.sync_enabled ? "default" : "secondary"} className="text-xs">
                      {provider.sync_enabled ? "Sync On" : "Sync Off"}
                    </Badge>
                    {provider.last_sync && (
                      <Badge variant="outline" className="text-xs">
                        Last: {new Date(provider.last_sync).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
