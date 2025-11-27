import { useState, useEffect, useRef } from "react";
import { Lock, Shield, Link2, FolderOpen, Image as ImageIcon, StopCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisLoadingOverlay } from "@/components/AnalysisLoadingOverlay";
import { SignupPromptModal } from "@/components/SignupPromptModal";
import { extractExifData, calculateOrientation, isValidImageFormat, isValidFileSize } from "@/lib/providers/manualUploadProvider";
import { compressImage, getOptimalQuality } from "@/lib/imageOptimization";
import { generateFileHash, checkDuplicateHash } from "@/lib/fileHash";
import { FloatingUploadProgress } from "@/components/FloatingUploadProgress";
import { useUpload } from "@/contexts/UploadContext";

const PhotoUpload = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{count: number, bestScore: number}>({count: 0, bestScore: 0});
  const [isCompressing, setIsCompressing] = useState(false);
  const [duplicates, setDuplicates] = useState<{file: File, existingPhoto: any}[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map());
  const [isMinimized, setIsMinimized] = useState(false);
  const analysisReadyRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);
  const { isUploading: isGlobalUploading } = useUpload();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cleanup thumbnail URLs on unmount
  useEffect(() => {
    return () => {
      thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [thumbnailUrls]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
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

    if (droppedFiles.length > 0) {
      await checkForDuplicates(droppedFiles);
    }
  };

  const checkForDuplicates = async (selectedFiles: File[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Guest users don't need duplicate check but still need thumbnails
      setFiles(selectedFiles);
      setDuplicates([]);
      
      // Generate thumbnail URLs for preview (only for browser-supported formats)
      // HEIC files can't be displayed natively in browsers
      const browserSupportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const newThumbnailUrls = new Map<string, string>();
      selectedFiles.forEach(file => {
        const isBrowserSupported = browserSupportedFormats.includes(file.type.toLowerCase());
        if (isBrowserSupported) {
          const url = URL.createObjectURL(file);
          newThumbnailUrls.set(file.name, url);
        }
        // HEIC and other unsupported formats will show fallback placeholder
      });
      setThumbnailUrls(newThumbnailUrls);
      
      // Auto-scroll to analysis section
      if (selectedFiles.length > 0) {
        setTimeout(() => {
          analysisReadyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
      return;
    }

    setCheckingDuplicates(true);
    const toastId = toast.loading("Checking for duplicates...");

    try {
      const foundDuplicates: {file: File, existingPhoto: any}[] = [];
      const uniqueFiles: File[] = [];
      const fileHashes = new Map<string, File>();

      // Check for duplicates within the batch first
      for (const file of selectedFiles) {
        const hash = await generateFileHash(file);
        
        if (fileHashes.has(hash)) {
          // Duplicate within batch
          toast.warning(`Skipped duplicate in batch: ${file.name}`);
          continue;
        }
        
        fileHashes.set(hash, file);
        
        // Check against database
        const { isDuplicate, existingPhoto } = await checkDuplicateHash(supabase, user.id, hash);
        
        if (isDuplicate) {
          foundDuplicates.push({ file, existingPhoto });
        } else {
          uniqueFiles.push(file);
        }
      }

      setDuplicates(foundDuplicates);
      setFiles(uniqueFiles);

      // Generate thumbnail URLs for preview (only for browser-supported formats)
      // HEIC files can't be displayed natively in browsers
      const browserSupportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const newThumbnailUrls = new Map<string, string>();
      uniqueFiles.forEach(file => {
        const isBrowserSupported = browserSupportedFormats.includes(file.type.toLowerCase());
        if (isBrowserSupported) {
          const url = URL.createObjectURL(file);
          newThumbnailUrls.set(file.name, url);
        }
      });
      setThumbnailUrls(newThumbnailUrls);

      if (foundDuplicates.length > 0) {
        const duplicateNames = foundDuplicates.map(d => d.file.name).join(', ');
        toast.warning(
          `Found ${foundDuplicates.length} duplicate(s): ${duplicateNames.slice(0, 100)}${duplicateNames.length > 100 ? '...' : ''}`, 
          { id: toastId, duration: 6000 }
        );
      } else {
        toast.success(`No duplicates found! Ready to upload ${uniqueFiles.length} photo(s)`, { id: toastId });
      }

      // Auto-scroll to analysis section after duplicate check
      if (uniqueFiles.length > 0) {
        setTimeout(() => {
          analysisReadyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.error("Failed to check for duplicates. Proceeding with upload.", { id: toastId });
      setFiles(selectedFiles);
      setDuplicates([]);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const isFolder = e.target.hasAttribute('webkitdirectory');
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
      
      // Only apply 20 photo limit to individual file uploads, not folder uploads
      if (!isFolder && selectedFiles.length > 20) {
        toast.error("Maximum 20 photos per batch. Please select fewer files or use folder upload.");
        return;
      }
      
      await checkForDuplicates(selectedFiles);
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setUploading(false);
    setIsCompressing(false);
    setIsMinimized(false);
    toast.info("Upload cancelled");
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    cancelRef.current = false; // Reset cancel flag
    
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
          // Check for cancellation
          if (cancelRef.current) {
            toast.info(`Cancelled after ${analyzedCount} photos`, { id: toastId });
            break;
          }
          
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let successCount = 0;
      let failedCount = 0;
      const batchSize = 3; // Process 3 files concurrently
      
      for (let i = 0; i < files.length; i += batchSize) {
        // Check for cancellation before each batch
        if (cancelRef.current) {
          toast.info(`Upload cancelled after ${successCount} photos`);
          break;
        }
        
        const batch = files.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (file, batchIndex) => {
          // Skip if cancelled
          if (cancelRef.current) return;
          
          const fileIndex = i + batchIndex;
          setUploadProgress({ current: fileIndex + 1, total: files.length });
          
          try {
            // Extract EXIF data
            const exifData = await extractExifData(file);
            
            // Generate file hash for duplicate detection
            const fileHash = await generateFileHash(file);
            
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

                // Add 60 second timeout to prevent hanging
                const analysisPromise = supabase.functions.invoke('analyze-photo-claude', {
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

                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Analysis timeout - skipping photo')), 60000)
                );

                const { data: analysisData, error: analysisError } = await Promise.race([
                  analysisPromise,
                  timeoutPromise
                ]) as any;
                
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
                console.error(`AI analysis failed for ${file.name}:`, error);
                setIsCompressing(false);
                // Continue with upload even if analysis fails
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
                file_hash: fileHash, // Add file hash for duplicate detection
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
            failedCount++;
            // Continue with next photo instead of stopping
          }
        }));
        
        // Progress is shown in overlay, no need for toast
      }

      if (failedCount > 0) {
        toast.success(`Uploaded ${successCount} photo(s). ${failedCount} failed and were skipped.`, { duration: 6000 });
      } else if (!cancelRef.current) {
        toast.success(`Successfully uploaded ${successCount} photo(s)!`);
      }
      setFiles([]);
      setUploadProgress({ current: 0, total: 0 });
      
      // Trigger a page refresh to update gallery
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
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
                  Upload entire folders from Google Takeout or local storage
                </p>
              </div>

              {/* PRIMARY ACTION: Bulk/Folder Upload */}
              <div 
                className={`border-2 rounded-lg p-8 vault-transition cursor-pointer ${
                  isDragging
                    ? "border-vault-gold bg-vault-gold/5 scale-105"
                    : "border-vault-gold/70 hover:border-vault-gold bg-vault-gold/5"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="folder-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  /* @ts-ignore */
                  webkitdirectory=""
                  /* @ts-ignore */
                  directory=""
                  onChange={handleFileSelect}
                />
                
                <label htmlFor="folder-upload" className="cursor-pointer block">
                  <div className="space-y-4">
                    <FolderOpen className="h-16 w-16 text-vault-gold mx-auto" />
                    <p className="text-lg font-bold text-vault-platinum uppercase tracking-wide">
                      Upload Folder
                    </p>
                    <p className="text-sm text-vault-light-gray">
                      Drop entire folders or click to browse
                    </p>
                    <p className="text-xs text-vault-light-gray/70">
                      JPEG, PNG, RAW supported • No limits
                    </p>
                  </div>
                </label>
              </div>

              {/* TERTIARY ACTION: Single File Upload */}
              <div 
                className={`relative border-2 rounded-lg p-8 vault-transition cursor-pointer overflow-hidden ${
                  isDragging
                    ? "border-vault-gold bg-vault-gold/5 scale-105"
                    : "border-vault-gold/30 hover:border-vault-gold bg-gradient-to-br from-vault-gold/5 via-transparent to-vault-gold/10 hover:from-vault-gold/10 hover:to-vault-gold/15"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-vault-gold/0 via-vault-gold/5 to-vault-gold/0 opacity-0 hover:opacity-100 vault-transition" />
                
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
                
                <label htmlFor="file-upload" className="cursor-pointer block relative z-10">
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <Shield className="h-12 w-12 text-vault-gold mx-auto drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                      <div className="absolute inset-0 bg-vault-gold/20 blur-xl rounded-full" />
                    </div>
                    <p className="text-base font-bold text-vault-platinum uppercase tracking-wide">
                      Quick Upload
                    </p>
                    <p className="text-sm text-vault-light-gray">
                      Perfect for testing a few select shots
                    </p>
                    <p className="text-xs text-vault-gold/90 font-semibold uppercase tracking-wider">
                      Up to 20 photos • Instant Analysis
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
      
      {/* Duplicates found notification */}
      {duplicates.length > 0 && (
        <Card className="p-6 bg-amber-950/20 border-amber-700/50">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-amber-400 uppercase tracking-wide">
                  {duplicates.length} Duplicate{duplicates.length !== 1 ? "s" : ""} Detected
                </h4>
                <p className="text-sm text-amber-200/80 mt-1">
                  These photos are already in your vault and have been filtered out automatically.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {duplicates.slice(0, 8).map((dup, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden bg-vault-black border-2 border-amber-700/50 opacity-50"
                >
                  <img
                    src={URL.createObjectURL(dup.file)}
                    alt={dup.file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-amber-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-300 bg-vault-black/80 px-2 py-1 rounded">
                      DUPLICATE
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {duplicates.length > 8 && (
              <p className="text-xs text-amber-300/70 text-center">
                +{duplicates.length - 8} more duplicate{duplicates.length - 8 !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </Card>
      )}

      {files.length > 0 && (
        <Card ref={analysisReadyRef} className="p-8 bg-vault-dark-gray border-vault-mid-gray">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h4 className="font-black text-xl text-vault-platinum uppercase tracking-wide">Ready for Analysis</h4>
              <p className="text-sm text-vault-light-gray mt-1">
                {files.length} unique asset{files.length !== 1 ? "s" : ""} selected
                {duplicates.length > 0 && ` • ${duplicates.length} duplicate${duplicates.length !== 1 ? "s" : ""} filtered`}
              </p>
              {duplicates.length > 0 && (
                <div className="mt-3 text-xs bg-vault-gold/10 border border-vault-gold/30 rounded-lg p-3 max-w-md">
                  <p className="font-semibold text-vault-gold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Duplicates Prevented
                  </p>
                  <ul className="space-y-1 max-h-24 overflow-y-auto text-vault-light-gray/90">
                    {duplicates.map((dup, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-vault-gold">•</span>
                        <span className="flex-1">
                          <span className="font-medium">{dup.file.name}</span>
                          {dup.existingPhoto && (
                            <span className="text-vault-light-gray/60 block text-[10px]">
                              Already in vault ({new Date(dup.existingPhoto.created_at).toLocaleDateString()})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button
              onClick={handleUpload}
              size="lg"
              disabled={uploading || checkingDuplicates}
              className="bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-bold uppercase tracking-wide vault-glow-gold"
            >
              <Lock className="mr-2 h-5 w-5" />
              {checkingDuplicates ? "Checking..." : uploading ? "Analyzing..." : "Start Analysis"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.map((file, idx) => {
              const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
              return (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden bg-vault-black border-2 border-vault-mid-gray hover:border-vault-gold vault-transition"
                >
                  {thumbnailUrls.has(file.name) ? (
                    <img
                      src={thumbnailUrls.get(file.name)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-vault-light-gray p-2">
                      <ImageIcon className="h-8 w-8 mb-2 text-vault-gold/50" />
                      <span className="text-[10px] text-center truncate w-full px-1">
                        {file.name}
                      </span>
                      {isHeic && (
                        <span className="text-[8px] text-vault-gold/70 mt-1">HEIC</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Analysis loading overlay */}
      <AnalysisLoadingOverlay
        currentPhoto={uploadProgress.current}
        totalPhotos={uploadProgress.total}
        visible={uploading && !isMinimized}
        isCompressing={isCompressing}
        onCancel={handleCancel}
        onMinimize={handleMinimize}
      />
      
      {/* Minimized progress indicator */}
      {uploading && isMinimized && (
        <div 
          className="fixed bottom-4 right-4 z-50 cursor-pointer animate-fade-in"
          onClick={() => setIsMinimized(false)}
        >
          <Card className="bg-vault-dark-gray/95 backdrop-blur-lg border-vault-gold/30 p-4 shadow-2xl hover:scale-105 transition-transform">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-vault-gold/30 border-t-vault-gold rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="h-3 w-3 text-vault-gold" />
                </div>
              </div>
              <div className="flex flex-col min-w-[120px]">
                <div className="text-xs text-vault-platinum font-medium">
                  {uploadProgress.current}/{uploadProgress.total} photos
                </div>
                <div className="w-full h-1.5 bg-vault-mid-gray rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-vault-gold transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
      
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
