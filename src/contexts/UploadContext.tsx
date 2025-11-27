import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface UploadStats {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  vaultWorthy: number;
  currentFile: string;
  startTime: number;
}

interface UploadContextType {
  isUploading: boolean;
  isMinimized: boolean;
  isCancelled: boolean;
  stats: UploadStats;
  startUpload: (total: number) => void;
  updateStats: (stats: Partial<UploadStats>) => void;
  finishUpload: () => void;
  cancelUpload: () => void;
  toggleMinimize: () => void;
  setMinimized: (minimized: boolean) => void;
  shouldCancel: () => boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelRef = useRef(false);
  const [stats, setStats] = useState<UploadStats>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    vaultWorthy: 0,
    currentFile: '',
    startTime: 0,
  });

  const startUpload = (total: number) => {
    setIsUploading(true);
    setIsMinimized(false);
    setIsCancelled(false);
    cancelRef.current = false;
    setStats({
      total,
      processed: 0,
      successful: 0,
      failed: 0,
      vaultWorthy: 0,
      currentFile: '',
      startTime: Date.now(),
    });
  };

  const updateStats = (newStats: Partial<UploadStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  const finishUpload = () => {
    setIsUploading(false);
    setIsMinimized(false);
    setIsCancelled(false);
    cancelRef.current = false;
  };

  const cancelUpload = () => {
    cancelRef.current = true;
    setIsCancelled(true);
    setStats(prev => ({ ...prev, currentFile: '' }));
  };

  const shouldCancel = () => cancelRef.current;

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const setMinimized = (minimized: boolean) => {
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
        setMinimized,
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
