import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Shield, ShieldCheck, Lock, X, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export type WatermarkMode = "stealth" | "branded" | "fortress";
export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tiled";

export interface WatermarkConfig {
  mode: WatermarkMode;
  text: string;
  opacity: number;
  position: WatermarkPosition;
  fontSize: number;
  color: string;
  logoUrl?: string;
}

interface WatermarkStudioProps {
  photo: {
    id: string;
    url: string;
    filename: string;
    score?: number;
  };
  open: boolean;
  onClose: () => void;
  onApply: (config: WatermarkConfig) => Promise<void>;
}

const WATERMARK_PRESETS: Record<WatermarkMode, Partial<WatermarkConfig>> = {
  stealth: {
    mode: "stealth",
    opacity: 15,
    fontSize: 12,
    color: "#ffffff",
    position: "bottom-right",
    text: "© PhotoCurator"
  },
  branded: {
    mode: "branded",
    opacity: 40,
    fontSize: 24,
    color: "#000000",
    position: "center",
    text: "© Your Brand"
  },
  fortress: {
    mode: "fortress",
    opacity: 70,
    fontSize: 32,
    color: "#ff0000",
    position: "tiled",
    text: "PROTECTED"
  }
};

export const WatermarkStudio = ({ photo, open, onClose, onApply }: WatermarkStudioProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<WatermarkConfig>({
    mode: "branded",
    text: "© PhotoCurator",
    opacity: 40,
    position: "bottom-right",
    fontSize: 24,
    color: "#ffffff"
  });
  const [applying, setApplying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Smart preset based on score
  useEffect(() => {
    if (photo.score && photo.score >= 85) {
      setConfig(prev => ({ ...prev, ...WATERMARK_PRESETS.fortress }));
    } else if (photo.score && photo.score >= 70) {
      setConfig(prev => ({ ...prev, ...WATERMARK_PRESETS.branded }));
    } else {
      setConfig(prev => ({ ...prev, ...WATERMARK_PRESETS.stealth }));
    }
  }, [photo.score]);

  // Draw preview
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Set canvas size to match image aspect ratio
      const maxWidth = 800;
      const maxHeight = 600;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Apply watermark
      applyWatermarkToCanvas(ctx, width, height, config);
      setImageLoaded(true);
    };

    img.src = photo.url;
  }, [open, photo.url, config]);

  const applyWatermarkToCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cfg: WatermarkConfig
  ) => {
    ctx.save();
    ctx.globalAlpha = cfg.opacity / 100;
    ctx.fillStyle = cfg.color;
    ctx.font = `bold ${cfg.fontSize}px Arial`;

    const positions = getWatermarkPositions(width, height, cfg, ctx);
    
    positions.forEach(({ x, y, rotation }) => {
      ctx.save();
      ctx.translate(x, y);
      if (rotation) ctx.rotate(rotation);
      ctx.fillText(cfg.text, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  };

  const getWatermarkPositions = (width: number, height: number, cfg: WatermarkConfig, context: CanvasRenderingContext2D) => {
    const padding = 20;
    const textWidth = context.measureText(cfg.text).width;

    switch (cfg.position) {
      case "center":
        return [{ x: width / 2 - textWidth / 2, y: height / 2, rotation: 0 }];
      case "top-left":
        return [{ x: padding, y: padding + cfg.fontSize, rotation: 0 }];
      case "top-right":
        return [{ x: width - textWidth - padding, y: padding + cfg.fontSize, rotation: 0 }];
      case "bottom-left":
        return [{ x: padding, y: height - padding, rotation: 0 }];
      case "bottom-right":
        return [{ x: width - textWidth - padding, y: height - padding, rotation: 0 }];
      case "tiled":
        const positions = [];
        const spacing = 200;
        for (let y = 0; y < height; y += spacing) {
          for (let x = 0; x < width; x += spacing) {
            positions.push({ x, y, rotation: -Math.PI / 6 });
          }
        }
        return positions;
      default:
        return [{ x: width / 2, y: height / 2, rotation: 0 }];
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      await onApply(config);
      toast.success("Watermark applied successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to apply watermark");
    } finally {
      setApplying(false);
    }
  };

  const applyPreset = (mode: WatermarkMode) => {
    setConfig(prev => ({ ...prev, ...WATERMARK_PRESETS[mode] }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Watermark Studio - {photo.filename}
          </DialogTitle>
          <DialogDescription>
            Protect your photo with customizable watermarks
            {photo.score && ` (Score: ${photo.score.toFixed(1)} - ${
              photo.score >= 85 ? "Vault Worthy" : photo.score >= 70 ? "High Value" : "Archive"
            })`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold">Live Preview</h3>
            <div className="border rounded-lg overflow-hidden bg-muted">
              <canvas ref={canvasRef} className="w-full h-auto" />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Tabs defaultValue="presets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="presets">Smart Presets</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="presets" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant={config.mode === "stealth" ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => applyPreset("stealth")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4" />
                      <span className="font-semibold">Stealth Mode</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Subtle, low-opacity watermark (15%) - Perfect for social media
                    </span>
                  </Button>

                  <Button
                    variant={config.mode === "branded" ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => applyPreset("branded")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-semibold">Branded Mode</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Visible protection (40%) - Balanced branding and protection
                    </span>
                  </Button>

                  <Button
                    variant={config.mode === "fortress" ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => applyPreset("fortress")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4" />
                      <span className="font-semibold">Fortress Mode</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Maximum protection (70%, tiled) - For vault-worthy photos
                    </span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label>Watermark Text</Label>
                    <Input
                      value={config.text}
                      onChange={(e) => setConfig({ ...config, text: e.target.value })}
                      placeholder="© Your Brand"
                    />
                  </div>

                  <div>
                    <Label>Position</Label>
                    <Select
                      value={config.position}
                      onValueChange={(value: WatermarkPosition) =>
                        setConfig({ ...config, position: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="tiled">Tiled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Opacity: {config.opacity}%</Label>
                    <Slider
                      value={[config.opacity]}
                      onValueChange={([value]) => setConfig({ ...config, opacity: value })}
                      min={5}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div>
                    <Label>Font Size: {config.fontSize}px</Label>
                    <Slider
                      value={[config.fontSize]}
                      onValueChange={([value]) => setConfig({ ...config, fontSize: value })}
                      min={12}
                      max={72}
                      step={2}
                    />
                  </div>

                  <div>
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.color}
                        onChange={(e) => setConfig({ ...config, color: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        value={config.color}
                        onChange={(e) => setConfig({ ...config, color: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleApply} disabled={applying || !imageLoaded} className="flex-1">
                {applying ? "Applying..." : "Apply Watermark"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};