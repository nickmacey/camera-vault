import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  stats: UploadStats;
  startUpload: (total: number) => void;
  updateStats: (stats: Partial<UploadStats>) => void;
  finishUpload: () => void;
  toggleMinimize: () => void;
  setMinimized: (minimized: boolean) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
  };

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
        stats,
        startUpload,
        updateStats,
        finishUpload,
        toggleMinimize,
        setMinimized,
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
