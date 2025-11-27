import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateFileHash, checkDuplicateHash } from '@/lib/fileHash';
import { convertHeicToJpeg, isHeicFile } from '@/lib/heicConverter';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

const VAULT_WORTHY_THRESHOLD = 7.0;

interface UploadStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  rejected: number; // Photos that didn't meet quality threshold
  vaultWorthy: number;
  currentFile: string;
  startTime: number;
}

interface FilterOptions {
  skipSmallFiles: boolean;
  minFileSize: number;
  skipScreenshots: boolean;
  skipExisting: boolean;
}

interface UploadContextType {
  isUploading: boolean;
  isMinimized: boolean;
  isCancelled: boolean;
  stats: UploadStats;
  startUpload: (files: File[], filters: FilterOptions) => void;
  updateStats: (stats: Partial<UploadStats>) => void;
  finishUpload: () => void;
  cancelUpload: () => void;
  toggleMinimize: () => void;
  setMinimized: (minimized: boolean) => void;
  shouldCancel: () => boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const DEBUG = true;
const log = (...args: any[]) => {
  if (DEBUG) console.log('[UploadContext]', ...args);
};

const BATCH_SIZE = 5; // Smaller batches for analysis-first approach
const BATCH_DELAY = 1000;
const MAX_RETRIES = 2;

export function UploadProvider({ children }: { children: ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelRef = useRef(false);
  const processingRef = useRef(false);
  const [stats, setStats] = useState<UploadStats>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    rejected: 0,
    vaultWorthy: 0,
    currentFile: '',
    startTime: 0,
  });

  const shouldCancel = () => cancelRef.current;

  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as any
      };
      return await imageCompression(file, options);
    } catch (error) {
      log('Compression failed for', file.name, '- using original');
      return file;
    }
  };

  // Analyze photo FIRST before deciding to upload
  const analyzePhoto = async (file: File): Promise<{ score: number; description: string; suggestedName: string } | null> => {
    try {
      const compressedFile = await compressImage(file);
      
      // Convert to base64 for analysis
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });

      log('Analyzing photo:', file.name);
      const analysisResponse = await supabase.functions.invoke('analyze-photo', {
        body: { imageBase64: base64, filename: file.name }
      });

      if (analysisResponse.error) {
        if (analysisResponse.error.message?.includes('429')) {
          log('Rate limit hit, pausing 60 seconds');
          toast.warning('Rate limit reached. Pausing for 60 seconds...');
          await new Promise(resolve => setTimeout(resolve, 60000));
          
          const retry = await supabase.functions.invoke('analyze-photo', {
            body: { imageBase64: base64, filename: file.name }
          });
          if (retry.data) {
            return {
              score: retry.data.score || 0,
              description: retry.data.description || '',
              suggestedName: retry.data.suggestedName || file.name.replace(/\.[^/.]+$/, '')
            };
          }
        }
        throw new Error(analysisResponse.error.message || 'Analysis failed');
      }

      return {
        score: analysisResponse.data?.score || 0,
        description: analysisResponse.data?.description || '',
        suggestedName: analysisResponse.data?.suggestedName || file.name.replace(/\.[^/.]+$/, '')
      };
    } catch (error) {
      log('Analysis error:', error);
      return null;
    }
  };

  const processFile = async (file: File, filters: FilterOptions): Promise<'success' | 'skipped' | 'rejected' | 'failed'> => {
    try {
      // Convert HEIC to JPEG if needed
      let processedFile = file;
      if (isHeicFile(file)) {
        log('Converting HEIC file:', file.name);
        try {
          processedFile = await convertHeicToJpeg(file);
        } catch (convError) {
          log('HEIC conversion failed:', file.name);
          return 'failed';
        }
      }
      
      // Apply filters first
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

      // ANALYZE FIRST - before uploading
      log('Analyzing before upload:', processedFile.name);
      const analysis = await analyzePhoto(processedFile);
      
      if (!analysis) {
        log('Analysis failed:', processedFile.name);
        return 'failed';
      }

      // CHECK IF VAULT-WORTHY (score >= 7.0)
      if (analysis.score < VAULT_WORTHY_THRESHOLD) {
        log(`REJECTED (score ${analysis.score} < ${VAULT_WORTHY_THRESHOLD}):`, processedFile.name);
        return 'rejected';
      }

      log(`VAULT-WORTHY (score ${analysis.score}):`, processedFile.name);

      // Only now upload to storage since it passed the quality threshold
      const compressedFile = await compressImage(processedFile);
      const filePath = `${user.id}/${Date.now()}_${processedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      // Get dimensions
      const img = new Image();
      const dimensions = await new Promise<{width: number, height: number}>((resolve, reject) => {
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = URL.createObjectURL(compressedFile);
      });
      URL.revokeObjectURL(img.src);

      const orientation = dimensions.width > dimensions.height ? 'landscape'
                        : dimensions.width < dimensions.height ? 'portrait' : 'square';

      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          provider: 'manual_upload',
          storage_path: filePath,
          filename: analysis.suggestedName,
          mime_type: processedFile.type,
          file_size: compressedFile.size,
          file_hash: fileHash,
          width: dimensions.width,
          height: dimensions.height,
          orientation,
          score: analysis.score,
          description: analysis.description,
          analyzed_at: new Date().toISOString(),
          status: 'new'
        });

      if (dbError) throw dbError;
      return 'success';

    } catch (error: any) {
      log('ERROR processing file:', file.name, error);
      return 'failed';
    }
  };

  const processFileWithRetry = async (
    file: File, 
    filters: FilterOptions,
    maxRetries: number = MAX_RETRIES
  ): Promise<{ result: 'success' | 'skipped' | 'rejected' | 'failed', error?: string }> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await processFile(file, filters);
        return { result };
      } catch (error: any) {
        if (attempt === maxRetries) {
          return { result: 'failed', error: error.message || 'Unknown error' };
        }
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return { result: 'failed', error: 'Max retries exceeded' };
  };

  const startUpload = useCallback((files: File[], filters: FilterOptions) => {
    if (processingRef.current) {
      log('Upload already in progress');
      return;
    }
    
    log('=== STARTING UPLOAD (analyze-first mode) ===', files.length, 'files');
    log(`Quality threshold: ${VAULT_WORTHY_THRESHOLD}+`);
    processingRef.current = true;
    setIsUploading(true);
    setIsMinimized(false);
    setIsCancelled(false);
    cancelRef.current = false;
    
    const startTime = Date.now();
    setStats({
      total: files.length,
      processed: 0,
      successful: 0,
      failed: 0,
      rejected: 0,
      vaultWorthy: 0,
      currentFile: '',
      startTime,
    });

    // Run the upload loop asynchronously
    (async () => {
      let processed = 0;
      let successful = 0;
      let failed = 0;
      let rejected = 0;
      let vaultWorthy = 0;

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        if (cancelRef.current) {
          log('Upload cancelled by user');
          break;
        }

        const batch = files.slice(i, i + BATCH_SIZE);
        log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}`);
        
        // Process one at a time within batch for better rate limit handling
        for (const file of batch) {
          if (cancelRef.current) break;
          
          setStats(prev => ({ ...prev, currentFile: file.name }));
          
          const { result: fileResult } = await processFileWithRetry(file, filters);
          
          processed++;
          if (fileResult === 'success') {
            successful++;
            vaultWorthy++;
          } else if (fileResult === 'rejected') {
            rejected++;
          } else if (fileResult === 'failed') {
            failed++;
          }
          // 'skipped' doesn't increment failed, rejected, or successful

          setStats(prev => ({
            ...prev,
            processed,
            successful,
            failed,
            rejected,
            vaultWorthy,
          }));
        }

        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }

      log('=== UPLOAD COMPLETE ===');
      log(`Results: ${successful} vault-worthy, ${rejected} rejected, ${failed} failed`);
      setStats(prev => ({ ...prev, currentFile: '' }));
      processingRef.current = false;
      
      if (!cancelRef.current) {
        if (successful > 0) {
          toast.success(`${successful} vault-worthy photo${successful > 1 ? 's' : ''} added! ${rejected > 0 ? `(${rejected} didn't make the cut)` : ''}`);
        } else if (rejected > 0) {
          toast.info(`No photos met the vault-worthy threshold (7.0+). ${rejected} photo${rejected > 1 ? 's' : ''} analyzed.`);
        }
      }
    })();
  }, []);

  const updateStats = (newStats: Partial<UploadStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  const finishUpload = () => {
    setIsUploading(false);
    setIsMinimized(false);
    setIsCancelled(false);
    cancelRef.current = false;
    processingRef.current = false;
  };

  const cancelUpload = () => {
    cancelRef.current = true;
    setIsCancelled(true);
    setStats(prev => ({ ...prev, currentFile: '' }));
    toast.info(`Upload cancelled. ${stats.successful} photos were added to your vault.`);
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const setMinimizedState = (minimized: boolean) => {
    setIsMinimized(minimized);
  };

  return (
    <UploadContext.Provider
      value={{
        isUploading,
        isMinimized,
        isCancelled,
        stats,
        startUpload,
        updateStats,
        finishUpload,
        cancelUpload,
        toggleMinimize,
        setMinimized: setMinimizedState,
        shouldCancel,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
