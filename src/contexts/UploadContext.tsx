import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateFileHash, checkDuplicateHash } from '@/lib/fileHash';
import { convertHeicToJpeg, isHeicFile } from '@/lib/heicConverter';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

interface UploadStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
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

const BATCH_SIZE = 10;
const BATCH_DELAY = 500;
const MAX_RETRIES = 3;

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

  const processFile = async (file: File, filters: FilterOptions): Promise<'success' | 'skipped' | 'failed'> => {
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
      
      if (filters.skipSmallFiles && processedFile.size < filters.minFileSize * 1024) {
        return 'skipped';
      }

      if (filters.skipScreenshots && 
          (processedFile.name.toLowerCase().includes('screenshot') || 
           processedFile.name.toLowerCase().includes('screen shot') ||
           processedFile.name.toLowerCase().includes('screen_shot'))) {
        return 'skipped';
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileHash = await generateFileHash(processedFile);
      
      if (filters.skipExisting) {
        const { isDuplicate } = await checkDuplicateHash(supabase, user.id, fileHash);
        if (isDuplicate) {
          return 'skipped';
        }
      }

      const compressedFile = await compressImage(processedFile);
      const filePath = `${user.id}/${Date.now()}_${processedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

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

      // Call analysis
      let analysisData = null;
      const analysisResponse = await supabase.functions.invoke('analyze-photo', {
        body: { imageBase64: base64, filename: processedFile.name }
      });

      if (analysisResponse.error) {
        if (analysisResponse.error.message?.includes('429')) {
          log('Rate limit hit, pausing 60 seconds');
          toast.warning('Rate limit reached. Pausing for 60 seconds...');
          await new Promise(resolve => setTimeout(resolve, 60000));
          
          const retry = await supabase.functions.invoke('analyze-photo', {
            body: { imageBase64: base64, filename: processedFile.name }
          });
          if (retry.data) analysisData = retry.data;
          else throw new Error('Rate limit exceeded');
        } else {
          throw new Error(analysisResponse.error.message || 'Analysis failed');
        }
      } else {
        analysisData = analysisResponse.data;
      }

      const score = analysisData?.score || 0;
      const description = analysisData?.description || '';
      const suggestedName = analysisData?.suggestedName || file.name.replace(/\.[^/.]+$/, '');

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
          filename: suggestedName,
          mime_type: processedFile.type,
          file_size: compressedFile.size,
          file_hash: fileHash,
          width: dimensions.width,
          height: dimensions.height,
          orientation,
          score,
          description,
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
  ): Promise<{ result: 'success' | 'skipped' | 'failed', error?: string }> => {
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
    
    log('=== STARTING UPLOAD ===', files.length, 'files');
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
      vaultWorthy: 0,
      currentFile: '',
      startTime,
    });

    // Run the upload loop asynchronously
    (async () => {
      let processed = 0;
      let successful = 0;
      let failed = 0;
      let vaultWorthy = 0;

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        if (cancelRef.current) {
          log('Upload cancelled by user');
          break;
        }

        const batch = files.slice(i, i + BATCH_SIZE);
        log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}`);
        
        const results = await Promise.allSettled(
          batch.map(async (file) => {
            if (cancelRef.current) {
              return { result: 'skipped' as const, error: 'Cancelled' };
            }
            
            setStats(prev => ({ ...prev, currentFile: file.name }));
            return await processFileWithRetry(file, filters);
          })
        );
        
        if (cancelRef.current) break;
        
        results.forEach((result) => {
          processed++;
          if (result.status === 'fulfilled') {
            const { result: fileResult } = result.value;
            if (fileResult === 'success') {
              successful++;
              // Check if it's vault worthy (we'd need score from processFile)
            } else if (fileResult === 'failed') {
              failed++;
            }
          } else {
            failed++;
          }
        });

        setStats(prev => ({
          ...prev,
          processed,
          successful,
          failed,
          vaultWorthy,
        }));

        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }

      log('=== UPLOAD COMPLETE ===');
      setStats(prev => ({ ...prev, currentFile: '' }));
      processingRef.current = false;
      
      if (!cancelRef.current) {
        toast.success(`Upload complete! ${successful} photos analyzed`);
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
    toast.info(`Upload cancelled. ${stats.successful} photos were processed.`);
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
