import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sun, Contrast, Droplets, RotateCcw, Save, 
  Sparkles, ImageIcon, Palette, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BatchPhoto {
  id: string;
  filename: string;
  storage_path: string;
  url: string;
}

interface BatchPhotoEditorProps {
  photos: BatchPhoto[];
  onComplete?: () => void;
  onCancel?: () => void;
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

export const BatchPhotoEditor = ({ photos, onComplete, onCancel }: BatchPhotoEditorProps) => {
  const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
  const [activePreset, setActivePreset] = useState<string>("Original");
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const currentPhoto = photos[previewIndex];

  useEffect(() => {
    if (!currentPhoto?.url) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      renderCanvas();
    };
    img.src = currentPhoto.url;
  }, [currentPhoto?.url]);

  useEffect(() => {
    renderCanvas();
  }, [adjustments]);

  const renderCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    const maxWidth = 600;
    const maxHeight = 400;
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
  };

  const processPhoto = async (photo: BatchPhoto, userId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        try {
          // Create offscreen canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(false);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          ctx.filter = `
            brightness(${adjustments.brightness}%)
            contrast(${adjustments.contrast}%)
            saturate(${adjustments.saturation}%)
            blur(${adjustments.blur}px)
            grayscale(${adjustments.grayscale}%)
            sepia(${adjustments.sepia}%)
          `;

          ctx.drawImage(img, 0, 0, img.width, img.height);

          // Convert to blob
          const blob = await new Promise<Blob>((res, rej) => {
            canvas.toBlob(
              (b) => b ? res(b) : rej(new Error("Failed to create blob")),
              'image/jpeg',
              0.95
            );
          });

          // Upload
          const timestamp = Date.now();
          const editedPath = `${userId}/edited/${timestamp}_${photo.filename.replace(/\.[^/.]+$/, '')}.jpg`;
          
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(editedPath, blob, {
              contentType: 'image/jpeg',
              upsert: false
            });
          
          if (uploadError) throw uploadError;
          
          // Update database
          const { error: updateError } = await supabase
            .from('photos')
            .update({
              edited_storage_path: editedPath,
              edited_at: new Date().toISOString()
            })
            .eq('id', photo.id);
          
          if (updateError) throw updateError;
          
          resolve(true);
        } catch (err) {
          console.error("Error processing photo:", photo.id, err);
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = photo.url;
    });
  };

  const handleBatchSave = async () => {
    if (!isModified) {
      toast.error("No changes to apply");
      return;
    }

    setIsSaving(true);
    setSaveProgress(0);
    const toastId = toast.loading(`Applying edits to ${photos.length} photos...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let successCount = 0;
      
      for (let i = 0; i < photos.length; i++) {
        const success = await processPhoto(photos[i], user.id);
        if (success) successCount++;
        setSaveProgress(((i + 1) / photos.length) * 100);
      }

      if (successCount === photos.length) {
        toast.success(`All ${photos.length} photos edited successfully!`, { id: toastId });
      } else {
        toast.warning(`${successCount}/${photos.length} photos edited successfully`, { id: toastId });
      }
      
      onComplete?.();
    } catch (error: any) {
      console.error("Batch save error:", error);
      toast.error(error.message || "Failed to save photos", { id: toastId });
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
    } else if (direction === 'next' && previewIndex < photos.length - 1) {
      setPreviewIndex(previewIndex + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Batch Edit: {photos.length} Photos</h2>
          <p className="text-sm text-muted-foreground">
            Adjustments will be applied to all selected photos
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0 flex flex-col items-center justify-center bg-black/50 min-h-[350px]">
              <canvas 
                ref={canvasRef} 
                className="max-w-full max-h-[400px] rounded"
              />
            </CardContent>
          </Card>

          {/* Preview Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigatePreview('prev')}
              disabled={previewIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Preview: {previewIndex + 1} / {photos.length}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigatePreview('next')}
              disabled={previewIndex === photos.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setPreviewIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                  idx === previewIndex ? 'border-emerald-400' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={resetAdjustments}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All
            </Button>
            <div className="flex items-center gap-2">
              {isModified && (
                <span className="text-xs text-muted-foreground">Modified</span>
              )}
              <Button 
                onClick={handleBatchSave} 
                disabled={isSaving || !isModified}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? "Saving..." : `Apply to ${photos.length} Photos`}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isSaving && (
            <div className="space-y-2">
              <Progress value={saveProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Processing... {Math.round(saveProgress)}%
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
            </TabsList>

            <TabsContent value="adjust" className="mt-4 space-y-5">
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
                />
              </div>

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
                />
              </div>

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
                />
              </div>

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
                />
              </div>

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
                />
              </div>

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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
