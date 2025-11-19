import { useState } from "react";
import { Share2, Download, Instagram, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateSocialGrid, PhotoForGrid } from "@/lib/socialGridGenerator";
import { toast } from "sonner";

interface SocialShareDialogProps {
  photos: PhotoForGrid[];
  disabled?: boolean;
}

export const SocialShareDialog = ({ photos, disabled }: SocialShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [gridBlob, setGridBlob] = useState<Blob | null>(null);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      toast.info("Generating your social grid...");
      
      const blob = await generateSocialGrid(photos, 3000);
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setGridBlob(blob);
      toast.success("Grid generated successfully!");
    } catch (error: any) {
      console.error("Failed to generate grid:", error);
      toast.error(error.message || "Failed to generate grid");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!gridBlob) return;
    
    const url = URL.createObjectURL(gridBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault-collection-${new Date().toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Grid downloaded!");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Cleanup preview URL when dialog closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setGridBlob(null);
    } else {
      // Auto-generate when dialog opens
      handleGenerate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled || photos.length === 0}
          variant="outline"
          size="lg"
          className="border-vault-gold/30 text-vault-gold hover:bg-vault-gold/10 hover:text-vault-gold"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Grid
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl bg-vault-dark border-vault-gold/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
            <Instagram className="h-6 w-6 text-vault-gold" />
            SOCIAL MEDIA GRID
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <p className="text-vault-light-gray">
              Your top 9 photos, curated into a shareable 3×3 grid with VAULT branding.
            </p>
            <p className="text-sm text-vault-light-gray/70">
              Perfect for Instagram posts, portfolio showcases, or social media highlights.
            </p>
          </div>

          {/* Preview */}
          <div className="relative aspect-square bg-vault-black rounded-lg overflow-hidden border-2 border-vault-gold/20">
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-vault-black/80 backdrop-blur-sm z-10">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-vault-gold animate-spin mx-auto mb-4" />
                  <p className="text-vault-light-gray">Generating your collection...</p>
                  <p className="text-sm text-vault-light-gray/70 mt-1">This may take a few seconds</p>
                </div>
              </div>
            )}
            
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Social grid preview" 
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-vault-light-gray">
                  <p>Grid preview will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              variant="outline"
              className="flex-1 border-vault-gold/30 text-vault-gold hover:bg-vault-gold/10"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={!gridBlob || generating}
              className="flex-1 bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Grid (3000×3000)
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-vault-gold/5 border border-vault-gold/20 rounded-lg p-4">
            <h4 className="text-sm font-bold text-vault-gold mb-2">SHARING TIPS</h4>
            <ul className="text-xs text-vault-light-gray space-y-1">
              <li>• Grid is optimized at 3000×3000px for high-quality Instagram posts</li>
              <li>• VAULT branding appears in top-left corner</li>
              <li>• Your top 9 photos are automatically selected and arranged</li>
              <li>• Perfect for showcasing your best work in a single post</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
