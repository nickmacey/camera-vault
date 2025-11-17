import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SocialContent {
  title: string;
  captions: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  hashtags: {
    high: string[];
    medium: string[];
    niche: string[];
  };
  altText: string;
}

interface SocialContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: SocialContent | null;
  onRegenerate: () => void;
  loading: boolean;
}

export const SocialContentModal = ({
  open,
  onOpenChange,
  content,
  onRegenerate,
  loading,
}: SocialContentModalProps) => {
  const [editedContent, setEditedContent] = useState<SocialContent | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const currentContent = editedContent || content;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast({
      title: "Copied! ✓",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const copyInstagramFull = () => {
    if (!currentContent) return;
    const allHashtags = [
      ...currentContent.hashtags.high,
      ...currentContent.hashtags.medium,
      ...currentContent.hashtags.niche,
    ].map(tag => `#${tag}`).join(' ');
    
    const fullText = `${currentContent.captions.instagram}\n\n${allHashtags}`;
    copyToClipboard(fullText, "Instagram caption + tags");
  };

  if (!currentContent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-2 border-vault-gold">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-vault-gold text-center flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6" />
            SOCIAL CONTENT
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="instagram" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="twitter">Twitter</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          </TabsList>

          <TabsContent value="instagram" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-vault-gold">Caption</label>
              <Textarea
                value={currentContent.captions.instagram}
                onChange={(e) => setEditedContent({
                  ...currentContent,
                  captions: { ...currentContent.captions, instagram: e.target.value }
                })}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentContent.captions.instagram.length} characters</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-vault-gold">Hashtags</label>
              
              <div>
                <div className="text-xs text-vault-gold mb-2">High Relevance</div>
                <div className="flex flex-wrap gap-2">
                  {currentContent.hashtags.high.map((tag, i) => (
                    <Badge key={i} variant="default" className="bg-vault-gold text-background">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-score-good mb-2">Medium Reach</div>
                <div className="flex flex-wrap gap-2">
                  {currentContent.hashtags.medium.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="bg-score-good/20 text-score-good">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-foreground mb-2">Niche Community</div>
                <div className="flex flex-wrap gap-2">
                  {currentContent.hashtags.niche.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyInstagramFull} className="flex-1" variant="outline">
                {copiedItem === "Instagram caption + tags" ? (
                  <><Check className="h-4 w-4 mr-2" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy Caption + Tags</>
                )}
              </Button>
              <Button onClick={onRegenerate} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="twitter" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-vault-gold">Tweet</label>
              <Textarea
                value={currentContent.captions.twitter}
                onChange={(e) => setEditedContent({
                  ...currentContent,
                  captions: { ...currentContent.captions, twitter: e.target.value }
                })}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between text-xs">
                <span className={currentContent.captions.twitter.length > 280 ? 'text-destructive' : 'text-muted-foreground'}>
                  {currentContent.captions.twitter.length} / 280 characters
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => copyToClipboard(currentContent.captions.twitter, "Twitter caption")} 
                className="flex-1"
                variant="outline"
              >
                {copiedItem === "Twitter caption" ? (
                  <><Check className="h-4 w-4 mr-2" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy Tweet</>
                )}
              </Button>
              <Button onClick={onRegenerate} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-vault-gold">Post</label>
              <Textarea
                value={currentContent.captions.linkedin}
                onChange={(e) => setEditedContent({
                  ...currentContent,
                  captions: { ...currentContent.captions, linkedin: e.target.value }
                })}
                rows={8}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentContent.captions.linkedin.length} characters</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => copyToClipboard(currentContent.captions.linkedin, "LinkedIn caption")} 
                className="flex-1"
                variant="outline"
              >
                {copiedItem === "LinkedIn caption" ? (
                  <><Check className="h-4 w-4 mr-2" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy Post</>
                )}
              </Button>
              <Button onClick={onRegenerate} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-vault-gold">High Relevance</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(
                      currentContent.hashtags.high.map(t => `#${t}`).join(' '),
                      "High relevance tags"
                    )}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentContent.hashtags.high.map((tag, i) => (
                    <Badge key={i} className="bg-vault-gold text-background text-sm px-3 py-1">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-score-good">Medium Reach</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(
                      currentContent.hashtags.medium.map(t => `#${t}`).join(' '),
                      "Medium reach tags"
                    )}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentContent.hashtags.medium.map((tag, i) => (
                    <Badge key={i} className="bg-score-good/20 text-score-good text-sm px-3 py-1">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Niche Community</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(
                      currentContent.hashtags.niche.map(t => `#${t}`).join(' '),
                      "Niche tags"
                    )}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentContent.hashtags.niche.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  const allTags = [
                    ...currentContent.hashtags.high,
                    ...currentContent.hashtags.medium,
                    ...currentContent.hashtags.niche,
                  ].map(t => `#${t}`).join(' ');
                  copyToClipboard(allTags, "All hashtags");
                }}
                className="w-full"
                variant="outline"
              >
                {copiedItem === "All hashtags" ? (
                  <><Check className="h-4 w-4 mr-2" /> Copied All</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy All Hashtags</>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t border-border">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-vault-gold">SEO Title</label>
            <p className="text-sm text-foreground">{currentContent.title}</p>
          </div>
          <div className="space-y-2 mt-4">
            <label className="text-sm font-semibold text-vault-gold">Alt Text (Accessibility)</label>
            <p className="text-sm text-muted-foreground">{currentContent.altText}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
