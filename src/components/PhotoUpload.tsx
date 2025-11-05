import { useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PhotoUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} photo(s)...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let successCount = 0;
      
      for (const file of files) {
        try {
          // Upload to storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get image dimensions
          const img = new Image();
          const imageUrl = URL.createObjectURL(file);
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = imageUrl;
          });

          let score = null;
          let description = null;

          // AI Analysis if enabled
          if (useAI) {
            try {
              const reader = new FileReader();
              const base64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
                };
                reader.readAsDataURL(file);
              });

              const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-photo', {
                body: { imageBase64: base64, filename: file.name }
              });

              if (!analysisError && analysisData) {
                score = analysisData.score;
                description = analysisData.description;
              }
            } catch (error) {
              console.error('AI analysis failed:', error);
            }
          }

          // Save to database
          const { error: dbError } = await supabase
            .from('photos')
            .insert({
              user_id: user.id,
              filename: file.name,
              storage_path: fileName,
              description: description,
              score: score,
              width: img.width,
              height: img.height,
              status: 'new'
            });

          if (dbError) throw dbError;
          
          URL.revokeObjectURL(imageUrl);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      toast.success(`Successfully uploaded ${successCount} photo(s)!`, { id: toastId });
      setFiles([]);
      
      // Trigger a page refresh to update gallery
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card
        className={`p-12 border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mx-auto">
            <Upload className="h-12 w-12 text-primary" />
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-2">Upload Photos</h3>
            <p className="text-muted-foreground">
              Drag and drop your photos here, or click to browse
            </p>
          </div>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
          />

          <Button asChild variant="outline" size="lg">
            <label htmlFor="file-upload" className="cursor-pointer">
              <ImageIcon className="mr-2 h-5 w-5" />
              Choose Photos
            </label>
          </Button>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Switch
              id="ai-analysis"
              checked={useAI}
              onCheckedChange={setUseAI}
            />
            <Label htmlFor="ai-analysis" className="cursor-pointer">
              Enable AI Analysis
            </Label>
          </div>
        </div>
      </Card>

      {files.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">Selected Photos</h4>
              <p className="text-sm text-muted-foreground">
                {files.length} file(s) ready to upload
              </p>
            </div>
            <Button
              onClick={handleUpload}
              className="w-full sm:w-auto"
              size="lg"
              disabled={uploading}
            >
              <Upload className="mr-2 h-5 w-5" />
              {uploading ? "Uploading..." : `Upload & Analyze ${files.length} Photo${files.length !== 1 ? "s" : ""}`}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PhotoUpload;
