import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface VaultSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export const VaultSettings = ({ open, onOpenChange }: VaultSettingsProps) => {
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

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-2 border-vault-gold">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-vault-gold text-center">
            VAULT SETTINGS
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="scoring" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
            <TabsTrigger value="brand">Brand Voice</TabsTrigger>
          </TabsList>

          <TabsContent value="scoring" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-vault-gold mb-2">SCORING WEIGHTS</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Adjust what matters most in your photos
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-base">Technical Excellence</Label>
                    <span className="text-vault-gold font-mono">{settings.technical_weight}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sharpness, exposure, composition</p>
                  <Slider
                    value={[settings.technical_weight]}
                    onValueChange={([value]) => setSettings({ ...settings, technical_weight: value })}
                    max={100}
                    step={5}
                    className="py-4"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-base">Commercial Potential</Label>
                    <span className="text-vault-gold font-mono">{settings.commercial_weight}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Market demand, licensing value</p>
                  <Slider
                    value={[settings.commercial_weight]}
                    onValueChange={([value]) => setSettings({ ...settings, commercial_weight: value })}
                    max={100}
                    step={5}
                    className="py-4"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-base">Artistic Vision</Label>
                    <span className="text-vault-gold font-mono">{settings.artistic_weight}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Creativity, uniqueness, style</p>
                  <Slider
                    value={[settings.artistic_weight]}
                    onValueChange={([value]) => setSettings({ ...settings, artistic_weight: value })}
                    max={100}
                    step={5}
                    className="py-4"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-base">Emotional Resonance</Label>
                    <span className="text-vault-gold font-mono">{settings.emotional_weight}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Storytelling, viewer engagement</p>
                  <Slider
                    value={[settings.emotional_weight]}
                    onValueChange={([value]) => setSettings({ ...settings, emotional_weight: value })}
                    max={100}
                    step={5}
                    className="py-4"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="text-sm font-semibold mb-3">PRESETS</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyPreset('stock')}>
                    Stock Photography
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset('art')}>
                    Fine Art
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset('social')}>
                    Social Media
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset('personal')}>
                    Personal Archive
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset('default')}>
                    Reset to Default
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={saveSettings}
              disabled={loading}
              className="w-full bg-vault-gold text-background hover:bg-vault-gold/90 font-bold"
            >
              {loading ? "Saving..." : "Apply Settings"}
            </Button>
          </TabsContent>

          <TabsContent value="brand" className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-vault-gold mb-2">YOUR BRAND VOICE</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Customize how captions are generated
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Tone</Label>
                <RadioGroup
                  value={settings.tone}
                  onValueChange={(value) => setSettings({ ...settings, tone: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="professional" id="professional" />
                    <Label htmlFor="professional" className="font-normal cursor-pointer">
                      Professional & Polished
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="casual" id="casual" />
                    <Label htmlFor="casual" className="font-normal cursor-pointer">
                      Casual & Conversational
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poetic" id="poetic" />
                    <Label htmlFor="poetic" className="font-normal cursor-pointer">
                      Poetic & Artistic
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="educational" id="educational" />
                    <Label htmlFor="educational" className="font-normal cursor-pointer">
                      Educational & Informative
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="humorous" id="humorous" />
                    <Label htmlFor="humorous" className="font-normal cursor-pointer">
                      Humorous & Playful
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Style</Label>
                <RadioGroup
                  value={settings.style}
                  onValueChange={(value) => setSettings({ ...settings, style: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first-person" id="first-person" />
                    <Label htmlFor="first-person" className="font-normal cursor-pointer">
                      First person ("I captured this moment...")
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="third-person" id="third-person" />
                    <Label htmlFor="third-person" className="font-normal cursor-pointer">
                      Third person ("This image shows...")
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="observer" id="observer" />
                    <Label htmlFor="observer" className="font-normal cursor-pointer">
                      Observer ("Notice the interplay of light...")
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Personality</Label>
                <div className="space-y-2">
                  {['reflective', 'adventurous', 'technical', 'storyteller', 'minimalist', 'bold'].map((p) => (
                    <div key={p} className="flex items-center space-x-2">
                      <Checkbox
                        id={p}
                        checked={settings.personality.includes(p)}
                        onCheckedChange={() => togglePersonality(p)}
                      />
                      <Label htmlFor={p} className="font-normal cursor-pointer capitalize">
                        {p}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Emoji Preference</Label>
                <RadioGroup
                  value={settings.emoji_preference}
                  onValueChange={(value) => setSettings({ ...settings, emoji_preference: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sparingly" id="sparingly" />
                    <Label htmlFor="sparingly" className="font-normal cursor-pointer">
                      Sparingly (1-2 per caption)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderately" id="moderately" />
                    <Label htmlFor="moderately" className="font-normal cursor-pointer">
                      Moderately (3-5 per caption)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="never" />
                    <Label htmlFor="never" className="font-normal cursor-pointer">
                      Never
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Button
              onClick={saveSettings}
              disabled={loading}
              className="w-full bg-vault-gold text-background hover:bg-vault-gold/90 font-bold"
            >
              {loading ? "Saving..." : "Save Brand Voice"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export const SettingsButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-background/80 backdrop-blur-sm border-2 border-vault-gold text-vault-gold hover:bg-vault-gold hover:text-background transition-all duration-300"
        aria-label="Open settings"
      >
        <Settings className="h-6 w-6" />
      </button>
      <VaultSettings open={open} onOpenChange={setOpen} />
    </>
  );
};
