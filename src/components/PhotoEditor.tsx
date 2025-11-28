import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sun, Contrast, Droplets, RotateCcw, Download, Save, 
  Sparkles, ImageIcon, Palette, Loader2, Eye, EyeOff
} from "lucide-react";

interface PhotoEditorProps {
  photoUrl: string;
  photoId: string;
  filename: string;
  editedUrl?: string;
  onSaveComplete?: () => void;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

const defaultAdjustments: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

const presets = [
  { name: "Original", adjustments: defaultAdjustments },
  { name: "Vivid", adjustments: { ...defaultAdjustments, saturation: 140, contrast: 110 } },
  { name: "Warm", adjustments: { ...defaultAdjustments, sepia: 30, brightness: 105 } },
  { name: "Cool", adjustments: { ...defaultAdjustments, saturation: 80, brightness: 105, contrast: 105 } },
  { name: "B&W", adjustments: { ...defaultAdjustments, grayscale: 100 } },
  { name: "Vintage", adjustments: { ...defaultAdjustments, sepia: 50, saturation: 80, contrast: 90 } },
  { name: "Dramatic", adjustments: { ...defaultAdjustments, contrast: 130, saturation: 120, brightness: 95 } },
  { name: "Soft", adjustments: { ...defaultAdjustments, brightness: 108, contrast: 90, saturation: 90, blur: 0.5 } },
];

export const PhotoEditor = ({ photoUrl, photoId, filename, editedUrl, onSaveComplete }: PhotoEditorProps) => {
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
  const [activePreset, setActivePreset] = useState<string>("Original");
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [hasEditedVersion, setHasEditedVersion] = useState(!!editedUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Load the main editing image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      renderCanvas();
    };
    img.src = photoUrl;
    
    // Also keep original for comparison
    const origImg = new Image();
    origImg.crossOrigin = "anonymous";
    origImg.onload = () => {
      originalImageRef.current = origImg;
    };
    origImg.src = photoUrl;
  }, [photoUrl]);

  useEffect(() => {
    renderCanvas();
  }, [adjustments]);

  const renderCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Set canvas size maintaining aspect ratio
    const maxWidth = 800;
    const maxHeight = 600;
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
      height = (maxWidth / width) * height;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (maxHeight / height) * width;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    // Apply CSS filters
    ctx.filter = `
      brightness(${adjustments.brightness}%)
      contrast(${adjustments.contrast}%)
      saturate(${adjustments.saturation}%)
      blur(${adjustments.blur}px)
      grayscale(${adjustments.grayscale}%)
      sepia(${adjustments.sepia}%)
    `;

    ctx.drawImage(img, 0, 0, width, height);
  };

  const updateAdjustment = (key: keyof Adjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
    setActivePreset("");
    setIsModified(true);
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setAdjustments(preset.adjustments);
    setActivePreset(preset.name);
    setIsModified(preset.name !== "Original");
  };

  const resetAdjustments = () => {
    setAdjustments(defaultAdjustments);
    setActivePreset("Original");
    setIsModified(false);
    toast.success("Reset to original");
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `edited_${filename}`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
    toast.success("Photo downloaded!");
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    
    setIsSaving(true);
    const toastId = toast.loading("Saving edited photo...");
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          'image/jpeg',
          0.95
        );
      });
      
      // Create unique path for edited version
      const timestamp = Date.now();
      const editedPath = `${user.id}/edited/${timestamp}_${filename.replace(/\.[^/.]+$/, '')}.jpg`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(editedPath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Update database with edited path
      const { error: updateError } = await supabase
        .from('photos')
        .update({
          edited_storage_path: editedPath,
          edited_at: new Date().toISOString()
        })
        .eq('id', photoId);
      
      if (updateError) throw updateError;
      
      setHasEditedVersion(true);
      setIsModified(false);
      toast.success("Photo saved! Original preserved.", { id: toastId });
      onSaveComplete?.();
      
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save photo", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOriginal = () => {
    if (!canvasRef.current || !originalImageRef.current) return;
    
    setShowOriginal(!showOriginal);
    
    if (!showOriginal) {
      // Show original without filters
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = originalImageRef.current;
      ctx.filter = 'none';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      // Re-render with current adjustments
      renderCanvas();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Canvas Preview */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0 flex items-center justify-center bg-black/50 min-h-[400px]">
            <canvas 
              ref={canvasRef} 
              className="max-w-full max-h-[600px] rounded"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetAdjustments}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleOriginal}
              className={showOriginal ? "bg-muted" : ""}
            >
              {showOriginal ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showOriginal ? "Show Edited" : "Compare"}
            </Button>
            {isModified && (
              <span className="text-xs text-muted-foreground">Modified</span>
            )}
            {hasEditedVersion && !isModified && (
              <span className="text-xs text-emerald-400">✓ Saved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving || !isModified}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Controls Sidebar */}
      <div className="space-y-4">
        <Tabs defaultValue="adjust" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="adjust">Adjust</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="mt-4 space-y-6">
            {/* Brightness */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  Brightness
                </label>
                <span className="text-xs text-muted-foreground">{adjustments.brightness}%</span>
              </div>
              <Slider
                value={[adjustments.brightness]}
                onValueChange={([v]) => updateAdjustment('brightness', v)}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Contrast className="w-4 h-4 text-blue-400" />
                  Contrast
                </label>
                <span className="text-xs text-muted-foreground">{adjustments.contrast}%</span>
              </div>
              <Slider
                value={[adjustments.contrast]}
                onValueChange={([v]) => updateAdjustment('contrast', v)}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  Saturation
                </label>
                <span className="text-xs text-muted-foreground">{adjustments.saturation}%</span>
              </div>
              <Slider
                value={[adjustments.saturation]}
                onValueChange={([v]) => updateAdjustment('saturation', v)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            {/* Blur */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  Blur
                </label>
                <span className="text-xs text-muted-foreground">{adjustments.blur}px</span>
              </div>
              <Slider
                value={[adjustments.blur]}
                onValueChange={([v]) => updateAdjustment('blur', v)}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Grayscale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-400" />
                  Grayscale
                </label>
                <span className="text-xs text-muted-foreground">{adjustments.grayscale}%</span>
              </div>
              <Slider
                value={[adjustments.grayscale]}
                onValueChange={([v]) => updateAdjustment('grayscale', v)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Sepia */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Sepia
                </label>
                <span className="text-xs text-muted-foreground">{adjustments.sepia}%</span>
              </div>
              <Slider
                value={[adjustments.sepia]}
                onValueChange={([v]) => updateAdjustment('sepia', v)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </TabsContent>

          <TabsContent value="presets" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    activePreset === preset.name
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Click a preset to apply instantly
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
