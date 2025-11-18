import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Pause, Play, CheckCircle2, XCircle } from 'lucide-react';
import { pauseSyncJob, resumeSyncJob } from '@/lib/googlePhotos';
import { toast } from 'sonner';

interface SyncJob {
  id: string;
  status: string;
  total_photos: number | null;
  processed_photos: number;
  vault_worthy_found: number;
  high_value_found: number;
  archived_found: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface SyncProgressProps {
  jobId: string;
  onComplete?: () => void;
}

export function SyncProgress({ jobId, onComplete }: SyncProgressProps) {
  const [job, setJob] = useState<SyncJob | null>(null);
  const [pausing, setPausing] = useState(false);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    // Fetch initial state
    supabase
      .from('sync_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
      .then(({ data }) => {
        if (data) {
          setJob(data);
          if (data.status === 'complete' && onComplete) {
            onComplete();
          }
        }
      });

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`sync_job_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sync_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const updatedJob = payload.new as SyncJob;
          setJob(updatedJob);
          
          if (updatedJob.status === 'complete' && onComplete) {
            onComplete();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, onComplete]);

  const handlePause = async () => {
    if (!job) return;
    setPausing(true);
    try {
      await pauseSyncJob(job.id);
      toast.success('Sync paused');
    } catch (error: any) {
      toast.error('Failed to pause sync', { description: error.message });
    } finally {
      setPausing(false);
    }
  };

  const handleResume = async () => {
    if (!job) return;
    setResuming(true);
    try {
      await resumeSyncJob(job.id);
      toast.success('Sync resumed');
    } catch (error: any) {
      toast.error('Failed to resume sync', { description: error.message });
    } finally {
      setResuming(false);
    }
  };

  if (!job) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading sync status...</span>
        </div>
      </Card>
    );
  }

  const progress = job.total_photos 
    ? (job.processed_photos / job.total_photos) * 100 
    : 0;

  const elapsed = Math.floor((Date.now() - new Date(job.started_at).getTime()) / 1000);
  const rate = elapsed > 0 ? job.processed_photos / elapsed : 0;
  const remaining = job.total_photos ? job.total_photos - job.processed_photos : 0;
  const estimatedSeconds = rate > 0 ? remaining / rate : 0;
  const estimatedHours = Math.ceil(estimatedSeconds / 3600);

  // Status-specific rendering
  if (job.status === 'complete') {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            Sync Complete!
          </h3>
          <p className="text-muted-foreground mb-6">
            Analyzed {job.processed_photos.toLocaleString()} photos
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {job.vault_worthy_found}
              </p>
              <p className="text-xs text-muted-foreground">Elite</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {job.high_value_found}
              </p>
              <p className="text-xs text-muted-foreground">Stars</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {job.archived_found}
              </p>
              <p className="text-xs text-muted-foreground">Archived</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (job.status === 'failed') {
    return (
      <Card className="p-6 bg-destructive/10 border-destructive">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            Sync Failed
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {job.error_message || 'An unknown error occurred'}
          </p>
          <Button onClick={handleResume} disabled={resuming}>
            {resuming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              'Retry Sync'
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-foreground">
          {job.status === 'paused' ? 'Sync Paused' : 'Analyzing Your Library'}
        </h3>
        <div className="flex items-center text-muted-foreground">
          {job.status === 'running' && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          <span className="text-sm capitalize">{job.status}</span>
        </div>
      </div>

      <div className="mb-6">
        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          {job.processed_photos.toLocaleString()} of {job.total_photos?.toLocaleString() || '?'} photos analyzed
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {job.vault_worthy_found}
          </p>
          <p className="text-xs text-muted-foreground">Elite</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-secondary">
            {job.high_value_found}
          </p>
          <p className="text-xs text-muted-foreground">Stars</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">
            {job.archived_found}
          </p>
          <p className="text-xs text-muted-foreground">Archived</p>
        </div>
      </div>

      {job.status === 'running' && estimatedHours > 0 && (
        <div className="text-center text-sm text-muted-foreground mb-4">
          Time remaining: ~{estimatedHours} hour{estimatedHours !== 1 ? 's' : ''}
        </div>
      )}

      <div className="flex gap-3">
        {job.status === 'running' ? (
          <Button
            variant="outline"
            onClick={handlePause}
            disabled={pausing}
            className="flex-1"
          >
            {pausing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pausing...
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            )}
          </Button>
        ) : job.status === 'paused' ? (
          <Button
            variant="outline"
            onClick={handleResume}
            disabled={resuming}
            className="flex-1"
          >
            {resuming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Analysis runs in the background. You can close this and check back later.
      </p>
    </Card>
  );
}
