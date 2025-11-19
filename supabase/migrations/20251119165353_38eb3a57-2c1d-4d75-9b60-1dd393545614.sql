-- Add hero photo selection fields to photos table
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS is_hero boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hero_order integer DEFAULT NULL;

-- Create index for efficient hero photo queries
CREATE INDEX IF NOT EXISTS idx_photos_hero ON public.photos(user_id, is_hero, hero_order) WHERE is_hero = true;

-- Add comment
COMMENT ON COLUMN public.photos.is_hero IS 'Indicates if photo is selected for user hero carousel';
COMMENT ON COLUMN public.photos.hero_order IS 'Display order in user hero carousel (lower numbers first)';