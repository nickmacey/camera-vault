import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Photo {
  id: string;
  storage_path: string;
  overall_score: number | null;
  analyzed_at?: string | null;
}

export function useAutoAnalyze(photos: Photo[], onPhotoUpdated: (photoId: string, data: any) => void) {
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[]>([]);
  const processingRef = useRef(false);

  // Find unanalyzed photos when photos change
  useEffect(() => {
    const unanalyzed = photos.filter(p => p.overall_score === null && !analyzing.has(p.id));
    if (unanalyzed.length > 0) {
      setQueue(prev => {
        const newQueue = [...prev];
        unanalyzed.forEach(p => {
          if (!newQueue.includes(p.id)) {
            newQueue.push(p.id);
          }
        });
        return newQueue;
      });
    }
  }, [photos, analyzing]);

  // Process queue
  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current || queue.length === 0) return;
      
      processingRef.current = true;
      const photoId = queue[0];
      const photo = photos.find(p => p.id === photoId);
      
      if (!photo || photo.overall_score !== null) {
        // Already analyzed or not found, skip
        setQueue(prev => prev.slice(1));
        processingRef.current = false;
        return;
      }

      setAnalyzing(prev => new Set(prev).add(photoId));
      
      try {
        // Get signed URL for the photo
        const { data: urlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 300);
        
        if (!urlData?.signedUrl) throw new Error('Failed to get photo URL');

        // Fetch image and convert to base64
        const response = await fetch(urlData.signedUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });

        // Analyze with Claude
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-photo-claude', {
          body: { imageBase64: base64 }
        });

        if (analysisError) throw analysisError;

        // Update database
        const { error: updateError } = await supabase
          .from('photos')
          .update({
            technical_score: analysisData.technical_score,
            commercial_score: analysisData.commercial_score,
            artistic_score: analysisData.artistic_score,
            emotional_score: analysisData.emotional_score,
            overall_score: analysisData.overall_score,
            tier: analysisData.tier,
            ai_analysis: analysisData.ai_analysis,
            analyzed_at: new Date().toISOString()
          })
          .eq('id', photoId);

        if (updateError) throw updateError;

        // Notify parent component
        onPhotoUpdated(photoId, {
          technical_score: analysisData.technical_score,
          commercial_score: analysisData.commercial_score,
          artistic_score: analysisData.artistic_score,
          emotional_score: analysisData.emotional_score,
          overall_score: analysisData.overall_score,
          tier: analysisData.tier,
          ai_analysis: analysisData.ai_analysis,
          analyzed_at: new Date().toISOString()
        });

        toast.success(`Analyzed: Score ${analysisData.overall_score?.toFixed(1)}`);
      } catch (error) {
        console.error('Auto-analysis failed:', error);
        // Don't show error toast for each photo, just log it
      } finally {
        setAnalyzing(prev => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        setQueue(prev => prev.slice(1));
        processingRef.current = false;
      }
    };

    processQueue();
  }, [queue, photos, onPhotoUpdated]);

  return {
    analyzing,
    queueLength: queue.length,
    isAnalyzing: analyzing.size > 0 || queue.length > 0
  };
}
