import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startGooglePhotosSync, type ImportFilters } from "@/lib/googlePhotos";
import { toast } from "sonner";

interface GooglePhotosImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncStarted?: (jobId: string) => void;
}

export type { ImportFilters };

export function GooglePhotosImportModal({ open, onOpenChange, onSyncStarted }: GooglePhotosImportModalProps) {
  const [scanning, setScanning] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [starting, setStarting] = useState(false);
  const [filters, setFilters] = useState<ImportFilters>({
    excludeScreenshots: true,
    minFileSize: 500 * 1024,
    onlyCamera: false,
    dateRange: 'all',
  });

  const estimatedCount = Math.floor(totalCount * 0.75);
  const estimatedTime = (estimatedCount * 3) / 3600;
  const estimatedCost = estimatedCount * 0.002;

  useEffect(() => {
    if (open) {
      scanLibrary();
    }
  }, [open]);

  async function scanLibrary() {
    try {
      setScanning(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: provider } = await supabase
        .from('connected_providers')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google_photos')
        .single();

      if (!provider?.access_token) throw new Error('Not connected');

      const response = await fetch(
        'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100',
        { headers: { Authorization: `Bearer ${provider.access_token}` } }
      );

      const data = await response.json();
      setTotalCount(data.nextPageToken ? 10000 : (data.mediaItems?.length || 0));
      setScanning(false);
    } catch (error) {
      console.error('Failed to scan:', error);
      setScanning(false);
    }
  }

  async function handleStartSync() {
    try {
      setStarting(true);
      const syncJob = await startGooglePhotosSync(filters);
      toast.success('Sync started!', { description: 'Analysis running in background' });
      onSyncStarted?.(syncJob.id);
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to start sync', { description: error.message });
    } finally {
      setStarting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">📷 Google Photos Import</DialogTitle>
          <DialogDescription>Configure import settings</DialogDescription>
        </DialogHeader>

        {scanning ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Scanning library...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-4 border-y">
              <p className="text-sm text-muted-foreground">Total Photos</p>
              <p className="text-3xl font-bold">{totalCount.toLocaleString()}</p>
            </div>

            <div className="space-y-3">
              <Checkbox id="ss" checked={filters.excludeScreenshots} onCheckedChange={(c) => setFilters({...filters, excludeScreenshots: c as boolean})} />
              <Label htmlFor="ss">Skip screenshots</Label>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center border-t pt-6">
              <div><p className="text-2xl font-bold">{estimatedCount.toLocaleString()}</p><p className="text-sm text-muted-foreground">Photos</p></div>
              <div><p className="text-2xl font-bold">~{estimatedTime.toFixed(1)}h</p><p className="text-sm text-muted-foreground">Time</p></div>
              <div><p className="text-2xl font-bold">${estimatedCost.toFixed(2)}</p><p className="text-sm text-muted-foreground">Cost</p></div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={starting} className="flex-1">Cancel</Button>
              <Button onClick={handleStartSync} disabled={starting} className="flex-1">
                {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting...</> : 'Start Analysis'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
