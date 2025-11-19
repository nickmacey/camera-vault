import { useState, useEffect } from "react";
import { Lock, Shield, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisLoadingOverlay } from "@/components/AnalysisLoadingOverlay";
import { ProviderConnectionModal } from "@/components/ProviderConnectionModal";
import { SignupPromptModal } from "@/components/SignupPromptModal";
import { extractExifData, calculateOrientation, isValidImageFormat, isValidFileSize } from "@/lib/providers/manualUploadProvider";
import { compressImage, getOptimalQuality } from "@/lib/imageOptimization";

const PhotoUpload = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{count: number, bestScore: number}>({count: 0, bestScore: 0});
  const [isCompressing, setIsCompressing] = useState(false);

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

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
      if (!isValidImageFormat(file)) {
        toast.error(`${file.name}: Unsupported format. Please use JPEG, PNG, HEIC, or WebP`);
        return false;
      }
      if (!isValidFileSize(file)) {
        toast.error(`${file.name}: File too large. Maximum 50MB per photo`);
        return false;
      }
      return true;
    });

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
      const selectedFiles = Array.from(e.target.files).filter((file) => {
        if (!isValidImageFormat(file)) {
          toast.error(`${file.name}: Unsupported format`);
          return false;
        }
        if (!isValidFileSize(file)) {
          toast.error(`${file.name}: File too large (max 50MB)`);
          return false;
        }
        return true;
      });
      
      if (selectedFiles.length > 20) {
        toast.error("Maximum 20 photos per upload. Please select fewer files.");
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Guest flow - just analyze without saving
    if (!user) {
      setUploading(true);
      setUploadProgress({ current: 0, total: files.length });
      const toastId = toast.loading(`Analyzing ${files.length} photo(s)...`);

      try {
        let bestScore = 0;
        let analyzedCount = 0;

        for (const file of files) {
          setUploadProgress({ current: analyzedCount + 1, total: files.length });
          
          // Check if file is large (>4MB) and set compression indicator
          const isLargeFile = file.size > 4 * 1024 * 1024;
          if (isLargeFile) {
            setIsCompressing(true);
          }
          
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

              const { data: analysisData } = await supabase.functions.invoke('analyze-photo-claude', {
                body: { imageBase64: base64 }
              });
              
              setIsCompressing(false); // Clear compression indicator after analysis

              if (analysisData?.overall_score) {
                bestScore = Math.max(bestScore, analysisData.overall_score);
                analyzedCount++;
              }
            } catch (error) {
              console.error('Analysis failed:', error);
              setIsCompressing(false);
            }
          }
        }

        toast.success(`Analyzed ${analyzedCount} photo(s)!`, { id: toastId });
        setAnalysisResults({ count: analyzedCount, bestScore });
        setShowSignupPrompt(true);
        setFiles([]);
      } catch (error: any) {
        toast.error(error.message || "Analysis failed", { id: toastId });
      } finally {
        setUploading(false);
        setIsCompressing(false);
      }
      return;
    }

    // Authenticated flow - full upload and save
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
            // Extract EXIF data
            const exifData = await extractExifData(file);
            
            // Get image dimensions
            const img = new Image();
            const imageUrl = URL.createObjectURL(file);
            await new Promise((resolve) => {
              img.onload = resolve;
              img.src = imageUrl;
            });
            
            const width = exifData?.dimensions?.width || img.width;
            const height = exifData?.dimensions?.height || img.height;
            const orientation = calculateOrientation(width, height);
            const dateTaken = exifData?.dateTaken ? new Date(exifData.dateTaken) : new Date();

            let technicalScore = null;
            let commercialScore = null;
            let artisticScore = null;
            let emotionalScore = null;
            let overallScore = null;
            let tier = null;
            let aiAnalysis = null;
            let suggestedName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

            // AI Analysis if enabled
            if (useAI) {
              try {
                // Check if file is large (>4MB) and set compression indicator
                const isLargeFile = file.size > 4 * 1024 * 1024;
                if (isLargeFile) {
                  setIsCompressing(true);
                }
                
                // Get user settings for scoring weights
                const { data: settingsData } = await supabase
                  .from('user_settings')
                  .select('*')
                  .eq('user_id', user.id)
                  .single();

                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve) => {
                  reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                  };
                  reader.readAsDataURL(file);
                });

                const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-photo-claude', {
                  body: { 
                    imageBase64: base64,
                    userSettings: settingsData ? {
                      technical_weight: settingsData.technical_weight,
                      commercial_weight: settingsData.commercial_weight,
                      artistic_weight: settingsData.artistic_weight,
                      emotional_weight: settingsData.emotional_weight
                    } : undefined
                  }
                });
                
                setIsCompressing(false); // Clear compression indicator after analysis

                if (!analysisError && analysisData) {
                  technicalScore = analysisData.technical_score;
                  commercialScore = analysisData.commercial_score;
                  artisticScore = analysisData.artistic_score;
                  emotionalScore = analysisData.emotional_score;
                  overallScore = analysisData.overall_score;
                  tier = analysisData.tier;
                  aiAnalysis = analysisData.ai_analysis;
                }
              } catch (error) {
                console.error('AI analysis failed:', error);
                setIsCompressing(false);
              }
            }

            // Generate thumbnail with optimal compression
            const thumbnailFile = await compressImage(file, {
              maxSizeMB: 0.2,
              maxWidthOrHeight: 400,
              quality: getOptimalQuality(),
            });
            
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

            // Save to database with all metadata
            const displayName = suggestedName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const { error: dbError } = await supabase
              .from('photos')
              .insert({
                user_id: user.id,
                filename: displayName,
                storage_path: fileName,
                thumbnail_path: thumbnailName,
                // Provider data
                provider: 'manual_upload',
                external_id: fileName, // Use storage path as external ID for manual uploads
                mime_type: file.type,
                file_size: file.size,
                // Dimensions and orientation
                width,
                height,
                orientation,
                date_taken: dateTaken.toISOString(),
                // EXIF metadata
                camera_data: exifData?.camera ? JSON.parse(JSON.stringify(exifData.camera)) : null,
                location_data: exifData?.location ? JSON.parse(JSON.stringify(exifData.location)) : null,
                provider_metadata: {},
                // AI scores
                technical_score: technicalScore,
                commercial_score: commercialScore,
                artistic_score: artisticScore,
                emotional_score: emotionalScore,
                overall_score: overallScore,
                tier: tier,
                ai_analysis: aiAnalysis,
                analyzed_at: technicalScore ? new Date().toISOString() : null,
                status: 'new'
              } as any); // Type assertion needed until types regenerate after migration

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
      setIsCompressing(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="group relative w-full">
          <Card className="border-4 border-vault-mid-gray hover:border-vault-gold vault-transition rounded-lg p-16">
            <div className="text-center space-y-8">
              <div className="flex justify-center mb-4">
                <Lock className="h-20 w-20 text-vault-gold group-hover:rotate-12 vault-transition" />
              </div>

              <div>
                <h2 className="font-black text-4xl text-vault-platinum mb-4 uppercase tracking-tight">
                  {isAuthenticated ? 'Load your Vault' : 'Start Here'}
                </h2>
                <p className="text-base text-vault-light-gray">
                  Connect your photo library for instant AI analysis
                </p>
              </div>

              {/* PRIMARY ACTION: Connect Photo Source */}
              <Button 
                onClick={() => setShowProviderModal(true)}
                size="lg"
                className="bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold px-12 py-7 text-lg vault-glow-gold uppercase tracking-wide w-full max-w-md"
              >
                <Link2 className="mr-2 h-6 w-6" />
                Connect Google Photos
              </Button>

              {/* DIVIDER */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-vault-mid-gray/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-sm text-vault-light-gray uppercase tracking-wider">Or</span>
                </div>
              </div>

              {/* SECONDARY ACTION: Manual Upload */}
              <div 
                className={`border-2 rounded-lg p-8 vault-transition cursor-pointer ${
                  isDragging
                    ? "border-vault-gold bg-vault-gold/5 scale-105"
                    : "border-vault-mid-gray/50 hover:border-vault-gold/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
                
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="space-y-4">
                    <Shield className="h-12 w-12 text-vault-light-gray mx-auto" />
                    <p className="text-sm text-vault-light-gray">
                      Drop files or click to browse
                    </p>
                    <p className="text-xs text-vault-light-gray/70">
                      JPEG, PNG, RAW supported • Max 20 photos
                    </p>
                  </div>
                </label>
              </div>

              {/* AI Analysis Toggle */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Switch
                  id="ai-analysis"
                  checked={useAI}
                  onCheckedChange={setUseAI}
                />
                <Label 
                  htmlFor="ai-analysis" 
                  className="cursor-pointer text-vault-light-gray uppercase text-xs font-bold tracking-wide"
                >
                  AI Analysis
                </Label>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <ProviderConnectionModal open={showProviderModal} onOpenChange={setShowProviderModal} />

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
                  loading="lazy"
                  decoding="async"
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
        isCompressing={isCompressing}
      />
      
      {/* Signup prompt for guest users */}
      <SignupPromptModal 
        open={showSignupPrompt}
        onOpenChange={setShowSignupPrompt}
        photoCount={analysisResults.count}
        bestScore={analysisResults.bestScore}
      />
    </div>
  );
};

export default PhotoUpload;
