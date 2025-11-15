-- Add watermark-related columns to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS watermarked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS watermark_config jsonb,
ADD COLUMN IF NOT EXISTS watermark_applied_at timestamp with time zone;

-- Add index for faster watermark queries
CREATE INDEX IF NOT EXISTS idx_photos_watermarked ON public.photos(watermarked);
CREATE INDEX IF NOT EXISTS idx_photos_score_watermarked ON public.photos(score, watermarked);