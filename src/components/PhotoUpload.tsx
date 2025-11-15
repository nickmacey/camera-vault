import { useState, useEffect } from "react";
import { Lock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from 'browser-image-compression';
import { AnalysisLoadingOverlay } from "@/components/AnalysisLoadingOverlay";

const PhotoUpload = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

    if (droppedFiles.length > 20) {
      toast.error("Maximum 20 photos per upload. Please select fewer files.");
      return;
    }

    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 20) {
        toast.error("Maximum 20 photos per upload. Please select fewer files.");
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error("Please sign in to upload photos", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth")
        }
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    const toastId = toast.loading(`Uploading ${files.length} photo(s)...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let successCount = 0;
      const batchSize = 3; // Process 3 files concurrently
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (file, batchIndex) => {
          const fileIndex = i + batchIndex;
          setUploadProgress({ current: fileIndex + 1, total: files.length });
          
          try {
            // Get image dimensions first
            const img = new Image();
            const imageUrl = URL.createObjectURL(file);
            await new Promise((resolve) => {
              img.onload = resolve;
              img.src = imageUrl;
            });

            let score = null;
            let description = null;
            let suggestedName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

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
                  suggestedName = analysisData.suggestedName || suggestedName;
                }
              } catch (error) {
                console.error('AI analysis failed:', error);
              }
            }

            // Generate thumbnail
            const thumbnailOptions = {
              maxSizeMB: 0.2,
              maxWidthOrHeight: 400,
              useWebWorker: true,
              fileType: 'image/jpeg'
            };
            
            const thumbnailFile = await imageCompression(file, thumbnailOptions);
            
            // Upload original and thumbnail to storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${suggestedName}-${Date.now()}.${fileExt}`;
            const thumbnailName = `${user.id}/thumbnails/${suggestedName}-${Date.now()}-thumb.jpg`;
            
            const [uploadResult, thumbnailResult] = await Promise.all([
              supabase.storage.from('photos').upload(fileName, file),
              supabase.storage.from('photos').upload(thumbnailName, thumbnailFile)
            ]);

            if (uploadResult.error) throw uploadResult.error;
            if (thumbnailResult.error) throw thumbnailResult.error;

            // Save to database with thumbnail path
            const displayName = suggestedName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const { error: dbError } = await supabase
              .from('photos')
              .insert({
                user_id: user.id,
                filename: displayName,
                storage_path: fileName,
                thumbnail_path: thumbnailName,
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
        }));
        
        // Update progress toast
        toast.loading(`Uploading... ${Math.min(i + batchSize, files.length)}/${files.length}`, { id: toastId });
      }

      toast.success(`Successfully uploaded ${successCount} photo(s)!`, { id: toastId });
      setFiles([]);
      setUploadProgress({ current: 0, total: 0 });
      
      // Trigger a page refresh to update gallery
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="group relative w-full">
          <Card
            className={`border-4 rounded-lg p-24 vault-transition ${
              isDragging
                ? "border-vault-gold bg-vault-gold/5 vault-glow-gold scale-105"
                : "border-vault-mid-gray hover:border-vault-gold hover:vault-glow-gold"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-2">
                <div className={`vault-transition ${isDragging ? 'rotate-12' : 'group-hover:rotate-12'}`}>
                  <Lock className="h-20 w-20 text-vault-gold" />
                </div>
              </div>

              <div>
                <h2 className="font-black text-4xl text-vault-platinum mb-4 uppercase tracking-tight">
                  Secure Your Work
                </h2>
                <p className="text-base text-vault-light-gray">
                  Drop files or click to browse
                </p>
                <p className="text-xs text-vault-light-gray mt-2">
                  JPEG, PNG, RAW supported • AI analyzes in real-time
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

              <Button 
                asChild 
                size="lg"
                className="bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold px-8 py-6 text-base vault-glow-gold"
              >
                <label htmlFor="file-upload" className="cursor-pointer uppercase tracking-wide">
                  <Shield className="mr-2 h-5 w-5" />
                  Upload Photos
                </label>
              </Button>

              <div className="flex items-center justify-center gap-3 pt-4">
                <Switch
                  id="ai-analysis"
                  checked={useAI}
                  onCheckedChange={setUseAI}
                />
                <Label 
                  htmlFor="ai-analysis" 
                  className="cursor-pointer text-vault-light-gray uppercase text-sm font-bold tracking-wide"
                >
                  AI Analysis
                </Label>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {files.length > 0 && (
        <Card className="p-8 bg-vault-dark-gray border-vault-mid-gray">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h4 className="font-black text-xl text-vault-platinum uppercase tracking-wide">Ready for Analysis</h4>
              <p className="text-sm text-vault-light-gray mt-1">
                {files.length} asset{files.length !== 1 ? "s" : ""} selected
              </p>
            </div>
            <Button
              onClick={handleUpload}
              size="lg"
              disabled={uploading}
              className="bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold uppercase tracking-wide vault-glow-gold"
            >
              <Lock className="mr-2 h-5 w-5" />
              {uploading ? "Analyzing..." : "Start Analysis"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-vault-black border-2 border-vault-mid-gray hover:border-vault-gold vault-transition"
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
      
      {/* Analysis loading overlay */}
      <AnalysisLoadingOverlay
        currentPhoto={uploadProgress.current}
        totalPhotos={uploadProgress.total}
        visible={uploading}
      />
    </div>
  );
};

export default PhotoUpload;
