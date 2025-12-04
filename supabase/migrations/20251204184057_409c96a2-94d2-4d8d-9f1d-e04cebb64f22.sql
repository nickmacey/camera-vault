-- Add highlight reel fields to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS is_highlight_reel boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS highlight_reel_order integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS highlight_reel_preset text DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_photos_highlight_reel ON public.photos (is_highlight_reel, highlight_reel_order) WHERE is_highlight_reel = true;