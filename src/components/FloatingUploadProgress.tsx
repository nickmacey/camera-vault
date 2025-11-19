import { useUpload } from '@/contexts/UploadContext';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Minimize2, 
  Maximize2, 
  Upload, 
  CheckCircle2,
  Lock,
  X
} from 'lucide-react';
import { AnimatedLockIcon } from './AnimatedLockIcon';

export function FloatingUploadProgress() {
  const { isUploading, isMinimized, stats, toggleMinimize, finishUpload } = useUpload();

  if (!isUploading) return null;

  const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;
  const timeElapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const timeRemaining = stats.processed > 0 
    ? Math.floor((timeElapsed / stats.processed) * (stats.total - stats.processed))
    : 0;

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
          className="bg-vault-dark-gray/95 backdrop-blur-lg border-vault-gold/30 p-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
          onClick={toggleMinimize}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <AnimatedLockIcon className="w-6 h-6 text-vault-gold" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-vault-green rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col min-w-[120px]">
              <div className="text-xs text-vault-platinum font-medium">
                Processing {stats.processed}/{stats.total}
              </div>
              <Progress value={progress} className="h-1 mt-1" />
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
      <Card className="bg-gradient-to-br from-vault-dark-gray/98 to-black/98 backdrop-blur-xl border-vault-gold/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vault-gold/20">
          <div className="flex items-center gap-3">
            <AnimatedLockIcon className="w-6 h-6 text-vault-gold animate-pulse" />
            <div>
              <h3 className="text-vault-platinum font-semibold text-sm">
                Analyzing Photos
              </h3>
              <p className="text-vault-light-gray text-xs">
                {stats.processed} of {stats.total} complete
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
              <span>{Math.round(progress)}%</span>
              <span>{timeRemaining > 0 ? `~${formatTime(timeRemaining)} left` : 'Calculating...'}</span>
            </div>
          </div>

          {/* Current File */}
          {stats.currentFile && (
            <div className="bg-black/30 rounded-lg p-3 border border-vault-gold/10">
              <div className="text-xs text-vault-light-gray mb-1">Processing:</div>
              <div className="text-sm text-vault-platinum truncate">
                {stats.currentFile}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-vault-green/10 border border-vault-green/30 rounded-lg p-2 text-center">
              <CheckCircle2 className="w-4 h-4 text-vault-green mx-auto mb-1" />
              <div className="text-lg font-bold text-vault-green">{stats.successful}</div>
              <div className="text-[10px] text-vault-light-gray">Success</div>
            </div>
            
            <div className="bg-vault-gold/10 border border-vault-gold/30 rounded-lg p-2 text-center">
              <Lock className="w-4 h-4 text-vault-gold mx-auto mb-1" />
              <div className="text-lg font-bold text-vault-gold">{stats.vaultWorthy}</div>
              <div className="text-[10px] text-vault-light-gray">Vault</div>
            </div>
            
            {stats.failed > 0 && (
              <div className="bg-vault-red/10 border border-vault-red/30 rounded-lg p-2 text-center">
                <X className="w-4 h-4 text-vault-red mx-auto mb-1" />
                <div className="text-lg font-bold text-vault-red">{stats.failed}</div>
                <div className="text-[10px] text-vault-light-gray">Failed</div>
              </div>
            )}
          </div>

          {/* Complete Button (shown when done) */}
          {stats.processed === stats.total && stats.total > 0 && (
            <Button
              onClick={finishUpload}
              className="w-full bg-vault-gold hover:bg-vault-gold/90 text-black font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              View Results
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
