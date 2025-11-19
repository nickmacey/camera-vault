import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BatchEditData {
  description?: string;
  user_notes?: string;
  custom_tags?: string[];
  is_favorite?: boolean;
}

export function useBatchPhotoEdit() {
  const [isProcessing, setIsProcessing] = useState(false);

  const batchUpdatePhotos = async (photoIds: string[], updates: BatchEditData) => {
    if (photoIds.length === 0) {
      toast.error('No photos selected');
      return false;
    }

    try {
      setIsProcessing(true);
      const toastId = toast.loading(`Updating ${photoIds.length} photo(s)...`);

      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(filteredUpdates).length === 0) {
        toast.error('No changes to apply', { id: toastId });
        return false;
      }

      const { error } = await supabase
        .from('photos')
        .update(filteredUpdates)
        .in('id', photoIds);

      if (error) throw error;

      toast.success(`Successfully updated ${photoIds.length} photo(s)`, { id: toastId });
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update photos');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    batchUpdatePhotos,
    isProcessing,
  };
}
