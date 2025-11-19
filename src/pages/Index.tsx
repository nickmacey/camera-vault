import { useState, useEffect, useRef } from "react";
import { Lock, Shield, Award, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicHero } from "@/components/DynamicHero";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
import { EditorialGrid } from "@/components/EditorialGrid";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import StatsBar from "@/components/StatsBar";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AutoSyncSettings } from "@/components/AutoSyncSettings";
import { UserProfile } from "@/components/UserProfile";
import { FeaturedPhotosManager } from "@/components/FeaturedPhotosManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface UserSettings {
  technical_weight: number;
  commercial_weight: number;
  artistic_weight: number;
  emotional_weight: number;
  tone: string;
  style: string;
  personality: string[];
  emoji_preference: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("gallery");
  const { dynamicAccent } = useTop10Photos();
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    technical_weight: 70,
    commercial_weight: 80,
    artistic_weight: 60,
    emotional_weight: 50,
    tone: 'poetic',
    style: 'observer',
    personality: ['reflective'],
    emoji_preference: 'sparingly',
  });
  
  const scrollToUpload = () => {
    setActiveTab("upload");
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    if (activeTab === "settings") {
      loadSettings();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setSettings(data);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...settings,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings saved ✓",
        description: "Your preferences have been updated",
      });
    }
    setLoading(false);
  };

  const applyPreset = (preset: string) => {
    const presets: Record<string, Partial<UserSettings>> = {
      stock: {
        technical_weight: 90,
        commercial_weight: 95,
        artistic_weight: 50,
        emotional_weight: 40,
      },
      art: {
        technical_weight: 70,
        commercial_weight: 30,
        artistic_weight: 95,
        emotional_weight: 85,
      },
      social: {
        technical_weight: 60,
        commercial_weight: 70,
        artistic_weight: 75,
        emotional_weight: 80,
      },
      personal: {
        technical_weight: 50,
        commercial_weight: 20,
        artistic_weight: 80,
        emotional_weight: 95,
      },
      default: {
        technical_weight: 70,
        commercial_weight: 80,
        artistic_weight: 60,
        emotional_weight: 50,
      },
    };

    setSettings({ ...settings, ...presets[preset] });
  };

  const togglePersonality = (value: string) => {
    const current = settings.personality;
    if (current.includes(value)) {
      setSettings({ ...settings, personality: current.filter(p => p !== value) });
    } else {
      setSettings({ ...settings, personality: [...current, value] });
    }
  };
  
  // Apply dynamic accent color to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--vault-dynamic-accent', dynamicAccent);
  }, [dynamicAccent]);

  return (
    <div className="min-h-screen bg-background relative">
      <DynamicHero onCTAClick={scrollToUpload} />
      <CategoryShowcase />
      <StatsBar />

      <main ref={uploadSectionRef} className="container mx-auto px-3 sm:px-4 py-6 md:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-4 sm:mb-6 md:mb-8 bg-card border border-border h-12 sm:h-14 md:h-11 shadow-lg shadow-vault-gold/10">
            <TabsTrigger 
              value="upload" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <Lock className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline sm:inline">Upload</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" />
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <Shield className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline">Vault</span>
              <span className="xs:hidden">Gallery</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '0.3s' }} />
            </TabsTrigger>
            <TabsTrigger 
              value="elite" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <Award className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline">Collection</span>
              <span className="xs:hidden">Elite</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '0.6s' }} />
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <Settings className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline sm:inline">Settings</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '0.9s' }} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="animate-fade-in">
            <PhotoUpload />
          </TabsContent>

          <TabsContent value="gallery" className="animate-fade-in" data-gallery-section>
            <PhotoGallery />
          </TabsContent>

          <TabsContent value="elite" className="animate-fade-in">
            <EditorialGrid />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 p-4 md:p-8 animate-fade-in">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-vault-gold text-center mb-6 md:mb-8">VAULT SETTINGS</h2>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="scoring">Scoring</TabsTrigger>
                  <TabsTrigger value="brand">Brand Voice</TabsTrigger>
                  <TabsTrigger value="sync">Auto-Sync</TabsTrigger>
                  <TabsTrigger value="carousel">Carousel</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-6">
                  <UserProfile />
                </TabsContent>
                <TabsContent value="scoring" className="space-y-6">
                  <div className="space-y-4">
                    {['technical', 'commercial', 'artistic', 'emotional'].map((type) => (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="capitalize">{type} {type === 'technical' ? 'Excellence' : type === 'commercial' ? 'Potential' : type === 'artistic' ? 'Vision' : 'Resonance'}</Label>
                          <span className="text-vault-gold font-mono">{settings[`${type}_weight` as keyof UserSettings]}%</span>
                        </div>
                        <Slider value={[settings[`${type}_weight` as keyof UserSettings] as number]} onValueChange={([value]) => setSettings({ ...settings, [`${type}_weight`]: value })} max={100} step={5} />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4">
                      {['stock', 'art', 'social', 'personal', 'default'].map(p => (
                        <Button key={p} variant="outline" size="sm" onClick={() => applyPreset(p)} className="capitalize text-xs">{p}</Button>
                      ))}
                    </div>
                    <Button onClick={saveSettings} disabled={loading} className="w-full sm:w-auto">{loading ? "Saving..." : "Save Settings"}</Button>
                  </div>
                </TabsContent>
                <TabsContent value="brand" className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Tone</Label>
                      <RadioGroup value={settings.tone} onValueChange={(v) => setSettings({ ...settings, tone: v })}>
                        <div className="grid grid-cols-2 gap-2">
                          {['poetic', 'professional', 'casual', 'technical'].map(t => (
                            <div key={t} className="flex items-center space-x-2">
                              <RadioGroupItem value={t} id={t} />
                              <Label htmlFor={t} className="capitalize text-sm">{t}</Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-3">
                      <Label>Personality Traits</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['reflective', 'enthusiastic', 'analytical', 'creative', 'bold', 'subtle'].map(trait => (
                          <div key={trait} className="flex items-center space-x-2">
                            <Checkbox id={trait} checked={settings.personality.includes(trait)} onCheckedChange={() => togglePersonality(trait)} />
                            <Label htmlFor={trait} className="capitalize text-sm cursor-pointer">{trait}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={saveSettings} disabled={loading} className="w-full sm:w-auto">{loading ? "Saving..." : "Save Settings"}</Button>
                  </div>
                </TabsContent>
                <TabsContent value="sync"><AutoSyncSettings /></TabsContent>
                <TabsContent value="carousel" className="space-y-6">
                  <FeaturedPhotosManager />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <EditorialGrid />
      
      <footer className="border-t border-border mt-8 sm:mt-12 py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors underline"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="/terms" 
              className="hover:text-foreground transition-colors underline"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
