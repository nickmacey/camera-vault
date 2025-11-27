import { useState, useEffect } from 'react';
import { useUpload } from '@/contexts/UploadContext';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Minimize2, 
  Maximize2, 
  CheckCircle2,
  Lock,
  X,
  Loader2,
  Image as ImageIcon,
  StopCircle,
  AlertTriangle
} from 'lucide-react';
import { AnimatedLockIcon } from './AnimatedLockIcon';

export function FloatingUploadProgress() {
  const { isUploading, isMinimized, isCancelled, stats, toggleMinimize, finishUpload, cancelUpload } = useUpload();
  const [dots, setDots] = useState('');

  // Animated dots for "Processing..." text
  useEffect(() => {
    if (!isUploading) return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [isUploading]);

  if (!isUploading) return null;

  const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;
  const timeElapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const timeRemaining = stats.processed > 0 
    ? Math.floor((timeElapsed / stats.processed) * (stats.total - stats.processed))
    : 0;
  const isComplete = stats.processed === stats.total && stats.total > 0 && !isCancelled;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Minimized view - compact floating indicator
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <Card 
          className={`bg-vault-dark-gray/95 backdrop-blur-lg ${isCancelled ? 'border-amber-500/30' : 'border-vault-gold/30'} p-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform`}
          onClick={toggleMinimize}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {isCancelled ? (
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              ) : isComplete ? (
                <CheckCircle2 className="w-6 h-6 text-vault-green" />
              ) : (
                <>
                  <AnimatedLockIcon className="w-6 h-6 text-vault-gold" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-vault-green rounded-full animate-pulse" />
                </>
              )}
            </div>
            <div className="flex flex-col min-w-[140px]">
              <div className="text-xs text-vault-platinum font-medium">
                {isCancelled ? 'Cancelled' : isComplete ? 'Complete!' : `Processing ${stats.processed}/${stats.total}`}
              </div>
              <Progress value={progress} className="h-1.5 mt-1" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-vault-platinum hover:text-vault-gold"
              onClick={(e) => {
                e.stopPropagation();
                toggleMinimize();
              }}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Expanded view - detailed progress
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in w-full max-w-md mx-4 sm:mx-0">
      <Card className={`bg-gradient-to-br from-vault-dark-gray/98 to-black/98 backdrop-blur-xl ${isCancelled ? 'border-amber-500/40' : 'border-vault-gold/40'} shadow-2xl overflow-hidden`}>
        {/* Animated top border */}
        {!isComplete && !isCancelled && (
          <div className="h-1 bg-vault-dark-gray overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-vault-gold via-vault-gold/50 to-vault-gold animate-pulse"
              style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}
            />
          </div>
        )}
        
        {/* Cancelled banner */}
        {isCancelled && (
          <div className="h-1 bg-amber-500" />
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vault-gold/20">
          <div className="flex items-center gap-3">
            {isCancelled ? (
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            ) : isComplete ? (
              <CheckCircle2 className="w-6 h-6 text-vault-green" />
            ) : (
              <Loader2 className="w-6 h-6 text-vault-gold animate-spin" />
            )}
            <div>
              <h3 className="text-vault-platinum font-semibold text-sm">
                {isCancelled ? 'Upload Cancelled' : isComplete ? 'Analysis Complete!' : `Analyzing Photos${dots}`}
              </h3>
              <p className="text-vault-light-gray text-xs">
                {isCancelled 
                  ? `${stats.processed} of ${stats.total} processed before cancel`
                  : `${stats.processed} of ${stats.total} complete`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-vault-light-gray hover:text-vault-gold hover:bg-vault-gold/10"
              onClick={toggleMinimize}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-vault-light-gray">
              <span className="font-medium">{Math.round(progress)}%</span>
              <span>
                {isCancelled
                  ? 'Stopped'
                  : isComplete 
                    ? `Completed in ${formatTime(timeElapsed)}` 
                    : timeRemaining > 0 
                      ? `~${formatTime(timeRemaining)} remaining` 
                      : 'Calculating...'}
              </span>
            </div>
          </div>

          {/* Current File */}
          {stats.currentFile && !isComplete && !isCancelled && (
            <div className="bg-black/30 rounded-lg p-3 border border-vault-gold/10">
              <div className="flex items-center gap-2 text-xs text-vault-light-gray mb-1">
                <ImageIcon className="w-3 h-3" />
                <span>Now processing:</span>
              </div>
              <div className="text-sm text-vault-platinum truncate font-medium">
                {stats.currentFile}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-vault-gold/10 border border-vault-gold/30 rounded-lg p-2 text-center">
              <Lock className="w-4 h-4 text-vault-gold mx-auto mb-1" />
              <div className="text-lg font-bold text-vault-gold">{stats.vaultWorthy}</div>
              <div className="text-[10px] text-vault-light-gray">Vault-Worthy</div>
            </div>
            
            <div className="bg-vault-mid-gray/20 border border-vault-mid-gray/30 rounded-lg p-2 text-center">
              <X className="w-4 h-4 text-vault-mid-gray mx-auto mb-1" />
              <div className="text-lg font-bold text-vault-mid-gray">{(stats as any).rejected || 0}</div>
              <div className="text-[10px] text-vault-light-gray">Didn't Make Cut</div>
            </div>
          </div>

          {/* Action Buttons */}
          {isComplete || isCancelled ? (
            <Button
              onClick={finishUpload}
              className="w-full bg-vault-gold hover:bg-vault-gold/90 text-black font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isCancelled ? 'View Uploaded Photos' : 'View Results'}
            </Button>
          ) : (
            <Button
              onClick={cancelUpload}
              variant="outline"
              className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Cancel Upload
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
