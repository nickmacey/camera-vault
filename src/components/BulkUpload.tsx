import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import imageCompression from 'browser-image-compression';
import { 
  FolderOpen, 
  Play, 
  Pause, 
  StopCircle, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  Clock,
  TrendingUp,
  Search,
  FileCheck,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { AnimatedLockIcon } from './AnimatedLockIcon';
import { useUpload } from '@/contexts/UploadContext';
import { generateFileHash, checkDuplicateHash } from '@/lib/fileHash';
import { convertHeicToJpeg, isHeicFile } from '@/lib/heicConverter';

interface UploadStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  vaultWorthy: number;
  highValue: number;
  archive: number;
  currentFile: string;
  startTime: number;
  errors: Array<{ filename: string; error: string }>;
}

interface FilterOptions {
  skipSmallFiles: boolean;
  minFileSize: number;
  skipScreenshots: boolean;
  skipExisting: boolean;
}

interface ScanResults {
  totalFiles: number;
  totalSize: number;
  duplicates: number;
  screenshots: number;
  smallFiles: number;
  validFiles: number;
  estimatedCost: number;
  estimatedTime: number;
}

type UploadStatus = 'idle' | 'scanning' | 'scanned' | 'running' | 'paused' | 'complete' | 'cancelled';

const DEBUG = true;
const log = (...args: any[]) => {
  if (DEBUG) console.log('[BulkUpload]', ...args);
};

export function BulkUpload() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [stats, setStats] = useState<UploadStats>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    vaultWorthy: 0,
    highValue: 0,
    archive: 0,
    currentFile: '',
    startTime: 0,
    errors: []
  });
  const [filters, setFilters] = useState<FilterOptions>({
    skipSmallFiles: true,
    minFileSize: 100,
    skipScreenshots: true,
    skipExisting: true
  });
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  
  const folderInputRef = useRef<HTMLInputElement>(null);
  const shouldPauseRef = useRef(false);
  const { toast } = useToast();
  const { startUpload: startUploadContext, setMinimized, cancelUpload: cancelUploadContext, shouldCancel, finishUpload: finishUploadContext } = useUpload();

  const BATCH_SIZE = 10;
  const BATCH_DELAY = 500;
  const MAX_RETRIES = 3;

  useEffect(() => {
    log('Component mounted');
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      log('Auth status:', !!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      log('Auth changed:', !!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (folderInputRef.current) {
      log('Folder input ref connected:', {
        hasWebkitDirectory: folderInputRef.current.hasAttribute('webkitdirectory'),
        hasDirectory: folderInputRef.current.hasAttribute('directory'),
        multiple: folderInputRef.current.multiple,
        accept: folderInputRef.current.accept
      });
    } else {
      log('ERROR: Folder input ref is NULL');
    }
  }, [folderInputRef.current]);

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    log('=== FOLDER SELECT TRIGGERED ===');
    log('Event target:', e.target);
    log('Files object:', e.target.files);
    log('Files length:', e.target.files?.length);
    
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) {
      log('ERROR: No files received from input');
      toast({
        title: "No files selected",
        description: "Please select a folder with files",
        variant: "destructive"
      });
      return;
    }

    const selectedFiles = Array.from(filesList);
    log('Total files selected:', selectedFiles.length);
    log('First 5 files:', selectedFiles.slice(0, 5).map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    })));
    
    // Check both MIME type and file extension for image detection
    // HEIC files often have empty MIME type in browsers
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff', '.tif'];
    const imageFiles = selectedFiles.filter(file => {
      const hasImageMime = file.type.startsWith('image/');
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      const hasImageExtension = imageExtensions.includes(extension);
      const isImage = hasImageMime || hasImageExtension;
      
      if (!isImage) {
        log('Filtered out non-image:', file.name, 'type:', file.type, 'ext:', extension);
      }
      return isImage;
    });
    
    log('Image files after filter:', imageFiles.length);
    log('First 5 image files:', imageFiles.slice(0, 5).map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    })));
    
    if (imageFiles.length === 0) {
      log('ERROR: No image files found after filtering');
      toast({
        title: "No images found",
        description: "Please select a folder containing image files (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    log('SUCCESS: Setting files:', imageFiles.length);
    setFiles(imageFiles);
    setScanResults(null);
    setStats({
      total: imageFiles.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      vaultWorthy: 0,
      highValue: 0,
      archive: 0,
      currentFile: '',
      startTime: 0,
      errors: []
    });
    
    toast({
      title: "Folder loaded",
      description: `${imageFiles.length} images ready to scan`
    });
  }, [toast]);

  const handleButtonClick = () => {
    log('=== SELECT FOLDER BUTTON CLICKED ===');
    log('Folder input ref exists?', !!folderInputRef.current);
    
    if (!folderInputRef.current) {
      log('ERROR: Folder input ref is null!');
      toast({
        title: "Error",
        description: "Folder input not initialized. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    log('Triggering click on input element');
    try {
      folderInputRef.current.click();
      log('Click triggered successfully');
    } catch (error) {
      log('ERROR clicking input:', error);
      toast({
        title: "Error",
        description: "Failed to open folder selector. Please try again.",
        variant: "destructive"
      });
    }
  };

  const scanFolder = async () => {
    if (files.length === 0) {
      log('Scan aborted: no files');
      return;
    }

    log('=== STARTING FOLDER SCAN ===');
    log('Total files to scan:', files.length);
    setStatus('scanning');
    
    let totalSize = 0;
    let duplicates = 0;
    let screenshots = 0;
    let smallFiles = 0;
    
    const { data: { user } } = await supabase.auth.getUser();
    log('User for scan:', user?.id);
    
    for (const file of files) {
      totalSize += file.size;
      
      if (filters.skipSmallFiles && file.size < filters.minFileSize * 1024) {
        smallFiles++;
        continue;
      }
      
      if (filters.skipScreenshots && 
          (file.name.toLowerCase().includes('screenshot') || 
           file.name.toLowerCase().includes('screen shot') ||
           file.name.toLowerCase().includes('screen_shot'))) {
        screenshots++;
        continue;
      }
      
      if (filters.skipExisting && user) {
        const fileHash = await generateFileHash(file);
        const { isDuplicate } = await checkDuplicateHash(supabase, user.id, fileHash);
        if (isDuplicate) {
          duplicates++;
        }
      }
    }
    
    const validFiles = files.length - duplicates - screenshots - smallFiles;
    const estimatedCost = validFiles * 0.002;
    const estimatedTime = Math.ceil((validFiles * 3) / 60);
    
    const results: ScanResults = {
      totalFiles: files.length,
      totalSize,
      duplicates,
      screenshots,
      smallFiles,
      validFiles,
      estimatedCost,
      estimatedTime
    };
    
    log('Scan results:', results);
    setScanResults(results);
    setStatus('scanned');
    
    toast({
      title: "Scan complete",
      description: `${validFiles} files ready to upload`
    });
  };

  const checkFileExists = async (file: File): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const fileHash = await generateFileHash(file);
    const { isDuplicate } = await checkDuplicateHash(supabase, user.id, fileHash);
    return isDuplicate;
  };

  const compressImage = async (file: File): Promise<File> => {
    try {
      log('Compressing:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as any
      };
      
      const compressedFile = await imageCompression(file, options);
      log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      return compressedFile;
    } catch (error) {
      log('Compression failed for', file.name, '- using original:', error);
      return file;
    }
  };

  const processFile = async (file: File): Promise<'success' | 'skipped' | 'failed'> => {
    try {
      // Convert HEIC to JPEG if needed
      let processedFile = file;
      if (isHeicFile(file)) {
        log('Converting HEIC file:', file.name);
        try {
          processedFile = await convertHeicToJpeg(file);
          log('HEIC converted successfully:', processedFile.name);
        } catch (convError) {
          log('HEIC conversion failed, skipping:', file.name, convError);
          return 'failed';
        }
      }
      
      log('Processing file:', processedFile.name);
      
      if (filters.skipSmallFiles && processedFile.size < filters.minFileSize * 1024) {
        log('Skipped (too small):', processedFile.name);
        return 'skipped';
      }

      if (filters.skipScreenshots && 
          (processedFile.name.toLowerCase().includes('screenshot') || 
           processedFile.name.toLowerCase().includes('screen shot') ||
           processedFile.name.toLowerCase().includes('screen_shot'))) {
        log('Skipped (screenshot):', processedFile.name);
        return 'skipped';
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileHash = await generateFileHash(processedFile);
      
      if (filters.skipExisting) {
        const { isDuplicate } = await checkDuplicateHash(supabase, user.id, fileHash);
        if (isDuplicate) {
          log('Skipped (duplicate):', processedFile.name);
          return 'skipped';
        }
      }

      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const userSettings = settings || {
        technical_weight: 70,
        commercial_weight: 80,
        artistic_weight: 60,
        emotional_weight: 50
      };

      const compressedFile = await compressImage(processedFile);

      const filePath = `${user.id}/${Date.now()}_${processedFile.name}`;
      log('Uploading to storage:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, compressedFile);

      if (uploadError) {
        log('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      log('Converting to base64 for analysis');
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });

      log('Calling analyze-photo function');
      let analysisData = null;
      const analysisResponse = await supabase.functions.invoke('analyze-photo', {
        body: { 
          imageBase64: base64,
          filename: processedFile.name
        }
      });

      if (analysisResponse.error) {
        let errorMsg = 'Analysis failed';
        
        if (analysisResponse.error.message?.includes('429') || analysisResponse.error.message?.includes('rate limit')) {
          log('Rate limit hit, pausing 60 seconds');
          errorMsg = 'Rate limit reached. Pausing for 60 seconds...';
          toast({
            title: "Rate Limit",
            description: "Pausing for 60 seconds to avoid rate limits",
            variant: "default"
          });
          await new Promise(resolve => setTimeout(resolve, 60000));
          
          const retry = await supabase.functions.invoke('analyze-photo', {
            body: { imageBase64: base64, filename: processedFile.name }
          });
          
          if (retry.data) {
            analysisData = retry.data;
          } else {
            throw new Error('Rate limit exceeded - please try again later');
          }
        } else if (analysisResponse.error.message?.includes('402') || analysisResponse.error.message?.includes('quota')) {
          errorMsg = 'API quota exceeded - please add credits to your workspace';
          throw new Error(errorMsg);
        } else if (analysisResponse.error.message?.includes('storage')) {
          errorMsg = 'Storage upload failed - check connection';
          throw new Error(errorMsg);
        } else {
          throw new Error(`Analysis failed: ${analysisResponse.error.message || 'Unknown error'}`);
        }
      } else {
        analysisData = analysisResponse.data;
      }

      const score = analysisData?.score || 0;
      const description = analysisData?.description || '';
      const suggestedName = analysisData?.suggestedName || file.name.replace(/\.[^/.]+$/, '');

      log('Getting image dimensions');
      const img = new Image();
      const dimensions = await new Promise<{width: number, height: number}>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = URL.createObjectURL(compressedFile);
      });

      URL.revokeObjectURL(img.src);

      const orientation = dimensions.width > dimensions.height ? 'landscape'
                        : dimensions.width < dimensions.height ? 'portrait'
                        : 'square';

      log('Saving to database');
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          provider: 'manual_upload',
          storage_path: filePath,
          filename: suggestedName,
          mime_type: processedFile.type,
          file_size: compressedFile.size,
          file_hash: fileHash,
          width: dimensions.width,
          height: dimensions.height,
          orientation,
          score: score,
          description: description,
          analyzed_at: new Date().toISOString(),
          status: 'new'
        });

      if (dbError) {
        log('Database error:', dbError);
        throw dbError;
      }

      const tier = score >= 8 ? 'vaultWorthy' : score >= 6.5 ? 'highValue' : 'archive';
      setStats(prev => ({
        ...prev,
        [tier]: prev[tier] + 1
      }));

      log('SUCCESS:', processedFile.name, 'Score:', score);
      return 'success';

    } catch (error: any) {
      log('ERROR processing file:', file.name, error);
      return 'failed';
    }
  };

  const processFileWithRetry = async (
    file: File, 
    maxRetries: number = MAX_RETRIES
  ): Promise<{ result: 'success' | 'skipped' | 'failed', error?: string }> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await processFile(file);
        return { result };
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        
        if (isLastAttempt) {
          log(`Failed after ${maxRetries} attempts:`, file.name, error);
          return { 
            result: 'failed', 
            error: error.message || 'Unknown error'
          };
        }
        
        const delay = Math.pow(2, attempt) * 1000;
        log(`Retry ${attempt}/${maxRetries} for ${file.name} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { result: 'failed', error: 'Max retries exceeded' };
  };

  const startUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select a folder first",
        variant: "destructive"
      });
      return;
    }

    log('=== STARTING UPLOAD (delegating to context) ===');
    log('Total files:', files.length);
    
    setStatus('running');
    
    // Delegate to context which handles the upload even after navigation
    startUploadContext(files, filters);
    
    // Minimize after starting so user can navigate
    setMinimized(true);
    
    toast({
      title: "Upload started",
      description: `Processing ${files.length} photos in background. You can continue browsing.`
    });
  };

  const pauseUpload = () => {
    log('Pause requested');
    shouldPauseRef.current = true;
  };

  const resumeUpload = () => {
    log('Resume requested');
    const remainingFiles = files.slice(stats.processed);
    setFiles(remainingFiles);
    setStats(prev => ({ 
      ...prev, 
      total: remainingFiles.length,
      processed: 0
    }));
    setStatus('idle');
    startUpload();
  };

  const cancelUpload = () => {
    log('Cancel requested');
    shouldPauseRef.current = true;
    setStatus('cancelled');
    
    // Also cancel the context to update FloatingUploadProgress
    cancelUploadContext();
    
    toast({
      title: "Upload cancelled",
      description: `${stats.successful} photos were processed before cancellation. ${stats.total - stats.processed} remaining files were not uploaded.`
    });
  };

  const resetUpload = () => {
    log('Reset requested');
    setFiles([]);
    setScanResults(null);
    setStatus('idle');
    setStats({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      vaultWorthy: 0,
      highValue: 0,
      archive: 0,
      currentFile: '',
      startTime: 0,
      errors: []
    });
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;
  
  const getTimeRemaining = () => {
    if (stats.processed === 0 || stats.startTime === 0) return 'Calculating...';
    
    const elapsed = Date.now() - stats.startTime;
    const avgTimePerFile = elapsed / stats.processed;
    const remaining = stats.total - stats.processed;
    const estimatedMs = avgTimePerFile * remaining;
    
    const minutes = Math.floor(estimatedMs / 60000);
    const seconds = Math.floor((estimatedMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-8 border-vault-mid-gray bg-card">
        <div className="text-center space-y-4">
          <AnimatedLockIcon size={64} />
          <h3 className="text-xl font-bold text-vault-platinum">Authentication Required</h3>
          <p className="text-vault-light-gray">
            Please sign in to use bulk upload
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-vault-mid-gray bg-card">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-vault-platinum mb-2">Bulk Upload</h2>
            <p className="text-vault-light-gray">
              Upload and analyze entire folders of photos at once
            </p>
            {DEBUG && (
              <p className="text-xs text-yellow-500 mt-2">
                🐛 Debug mode enabled - Check browser console for detailed logs
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-vault-platinum mb-3">Filter Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipSmall"
                    checked={filters.skipSmallFiles}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, skipSmallFiles: checked as boolean }))
                    }
                  />
                  <Label htmlFor="skipSmall" className="text-vault-light-gray">
                    Skip small files (&lt; {filters.minFileSize}KB)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipScreenshots"
                    checked={filters.skipScreenshots}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, skipScreenshots: checked as boolean }))
                    }
                  />
                  <Label htmlFor="skipScreenshots" className="text-vault-light-gray">
                    Skip screenshots
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipExisting"
                    checked={filters.skipExisting}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, skipExisting: checked as boolean }))
                    }
                  />
                  <Label htmlFor="skipExisting" className="text-vault-light-gray">
                    Skip duplicates
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <input
                ref={folderInputRef}
                type="file"
                /* @ts-ignore */
                webkitdirectory=""
                /* @ts-ignore */
                directory=""
                multiple
                onChange={handleFolderSelect}
                className="hidden"
                accept="image/*"
              />
              <Button
                onClick={handleButtonClick}
                disabled={status === 'running' || status === 'scanning'}
                className="w-full bg-vault-gold hover:bg-[#C4A037] text-background"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Select Folder
              </Button>
            </div>

            {files.length > 0 && status === 'idle' && (
              <div className="p-4 bg-vault-dark-gray rounded-lg border border-vault-mid-gray">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-vault-platinum font-medium">
                      {files.length} images selected
                    </p>
                    <p className="text-sm text-vault-light-gray">
                      Ready to scan for analysis
                    </p>
                  </div>
                  <Button
                    onClick={scanFolder}
                    className="bg-vault-gold hover:bg-[#C4A037] text-background"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Scan Folder
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {status === 'scanning' && (
        <Card className="p-6 border-vault-mid-gray bg-card">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-vault-gold/10 flex items-center justify-center relative">
              <Search className="h-8 w-8 text-vault-gold" />
              <div className="absolute inset-0 rounded-full border-2 border-vault-gold/30 border-t-vault-gold animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-vault-platinum">Scanning folder...</h3>
              <p className="text-vault-light-gray">Analyzing files and checking for duplicates</p>
              <p className="text-xs text-vault-gold mt-2 animate-pulse">
                This may take a moment for large folders
              </p>
            </div>
          </div>
        </Card>
      )}

      {scanResults && status === 'scanned' && (
        <Card className="p-6 border-vault-mid-gray bg-card">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-vault-platinum mb-4">Scan Results</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                  <FileCheck className="h-6 w-6 mx-auto mb-2 text-vault-green" />
                  <p className="text-2xl font-bold text-vault-platinum">{scanResults.validFiles}</p>
                  <p className="text-xs text-vault-light-gray">Ready to Process</p>
                </div>
                
                <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 text-vault-gold" />
                  <p className="text-2xl font-bold text-vault-platinum">{scanResults.duplicates}</p>
                  <p className="text-xs text-vault-light-gray">Duplicates</p>
                </div>
                
                <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                  <ImageIcon className="h-6 w-6 mx-auto mb-2 text-vault-light-gray" />
                  <p className="text-2xl font-bold text-vault-platinum">{scanResults.screenshots}</p>
                  <p className="text-xs text-vault-light-gray">Screenshots</p>
                </div>
                
                <div className="text-center p-4 bg-vault-dark-gray rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-vault-light-gray" />
                  <p className="text-2xl font-bold text-vault-platinum">{scanResults.smallFiles}</p>
                  <p className="text-xs text-vault-light-gray">Small Files</p>
                </div>
              </div>

              <div className="bg-vault-dark-gray rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-vault-light-gray">Total Size:</span>
                  <span className="text-vault-platinum font-medium">
                    {(scanResults.totalSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vault-light-gray">Estimated Cost:</span>
                  <span className="text-vault-platinum font-medium">
                    ${scanResults.estimatedCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vault-light-gray">Estimated Time:</span>
                  <span className="text-vault-platinum font-medium">
                    ~{scanResults.estimatedTime} minutes
                  </span>
                </div>
              </div>
            </div>

            {scanResults.validFiles > 0 && (
              <div className="flex gap-3">
                <Button
                  onClick={scanFolder}
                  variant="outline"
                  className="flex-1"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Scan Again
                </Button>
                <Button
                  onClick={startUpload}
                  className="flex-1 bg-vault-gold hover:bg-[#C4A037] text-background"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Upload ({scanResults.validFiles} files)
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {(status === 'running' || status === 'paused') && (
        <Card className="p-6 border-vault-mid-gray bg-card">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-vault-platinum">
                  {status === 'running' ? 'Processing Photos...' : 'Paused'}
                </h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMinimized(true)}
                    className="text-vault-light-gray hover:text-vault-gold hover:bg-vault-gold/10"
                  >
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Minimize
                  </Button>
                  <span className="text-vault-gold font-mono text-xl font-bold">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              
              <Progress value={progress} className="h-3 mb-2" />
              
              <div className="flex justify-between text-sm text-vault-light-gray">
                <span>{stats.processed} of {stats.total} processed</span>
                <span>Time remaining: {getTimeRemaining()}</span>
              </div>
            </div>

            {stats.currentFile && (
              <div className="bg-vault-dark-gray rounded-lg p-4 border border-vault-gold/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-vault-gold animate-pulse" />
                  <p className="text-xs text-vault-light-gray">Currently analyzing:</p>
                </div>
                <p className="text-sm text-vault-platinum font-medium truncate">
                  {stats.currentFile}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-vault-green" />
                <p className="text-xl font-bold text-vault-platinum">{stats.successful}</p>
                <p className="text-xs text-vault-light-gray">Successful</p>
              </div>
              
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <AlertCircle className="h-6 w-6 mx-auto mb-1 text-vault-gold" />
                <p className="text-xl font-bold text-vault-platinum">{stats.skipped}</p>
                <p className="text-xs text-vault-light-gray">Skipped</p>
              </div>
              
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <AlertCircle className="h-6 w-6 mx-auto mb-1 text-red-400" />
                <p className="text-xl font-bold text-vault-platinum">{stats.failed}</p>
                <p className="text-xs text-vault-light-gray">Failed</p>
              </div>
              
              <div className="text-center p-3 bg-vault-dark-gray rounded-lg">
                <ImageIcon className="h-6 w-6 mx-auto mb-1 text-vault-platinum" />
                <p className="text-xl font-bold text-vault-platinum">
                  {stats.total - stats.processed}
                </p>
                <p className="text-xs text-vault-light-gray">Remaining</p>
              </div>
            </div>

            <div className="border-t border-vault-mid-gray pt-4">
              <h4 className="text-sm font-bold text-vault-platinum uppercase mb-3">
                Quality Distribution
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-vault-gold/10 border border-vault-gold rounded-lg">
                  <p className="text-2xl font-bold text-vault-gold">{stats.vaultWorthy}</p>
                  <p className="text-xs text-vault-light-gray">Vault Worthy</p>
                </div>
                <div className="text-center p-3 bg-vault-green/10 border border-vault-green rounded-lg">
                  <p className="text-2xl font-bold text-vault-green">{stats.highValue}</p>
                  <p className="text-xs text-vault-light-gray">High Value</p>
                </div>
                <div className="text-center p-3 bg-vault-mid-gray rounded-lg">
                  <p className="text-2xl font-bold text-vault-platinum">{stats.archive}</p>
                  <p className="text-xs text-vault-light-gray">Archive</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {status === 'running' ? (
                <Button
                  onClick={pauseUpload}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={resumeUpload}
                  className="flex-1 bg-vault-gold hover:bg-[#C4A037] text-background"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
              
              <Button
                onClick={cancelUpload}
                variant="outline"
                className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>

            {stats.errors.length > 0 && (
              <details className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <summary className="cursor-pointer text-red-400 font-medium text-sm">
                  {stats.errors.length} errors occurred (click to view)
                </summary>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {stats.errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-vault-light-gray">
                      <span className="text-red-400">{err.filename}:</span> {err.error}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </Card>
      )}

      {status === 'complete' && (
        <Card className="p-8 border-vault-gold bg-card">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-vault-gold/10 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-vault-gold" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-vault-platinum mb-2">
                Upload Complete!
              </h3>
              <p className="text-vault-light-gray">
                {stats.successful} photos successfully analyzed and added to your vault
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-vault-gold/10 border border-vault-gold rounded-lg">
                <p className="text-3xl font-bold text-vault-gold mb-1">
                  {stats.vaultWorthy}
                </p>
                <p className="text-sm text-vault-light-gray">Vault Worthy</p>
              </div>
              <div className="text-center p-4 bg-vault-green/10 border border-vault-green rounded-lg">
                <p className="text-3xl font-bold text-vault-green mb-1">
                  {stats.highValue}
                </p>
                <p className="text-sm text-vault-light-gray">High Value</p>
              </div>
              <div className="text-center p-4 bg-vault-mid-gray rounded-lg">
                <p className="text-3xl font-bold text-vault-platinum mb-1">
                  {stats.archive}
                </p>
                <p className="text-sm text-vault-light-gray">Archive</p>
              </div>
            </div>

            {stats.failed > 0 && (
              <p className="text-sm text-red-400">
                {stats.failed} files failed to process
              </p>
            )}

            {stats.skipped > 0 && (
              <p className="text-sm text-vault-light-gray">
                {stats.skipped} files were skipped (duplicates or filtered)
              </p>
            )}

            <div className="flex gap-3 max-w-md mx-auto">
              <Button
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('tab', 'gallery');
                  window.location.search = params.toString();
                }}
                className="flex-1 bg-vault-gold hover:bg-[#C4A037] text-background"
              >
                View Gallery
              </Button>
              <Button
                onClick={resetUpload}
                variant="outline"
                className="flex-1"
              >
                Upload More
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
