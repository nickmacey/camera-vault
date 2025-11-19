-- Add featured photos functionality
ALTER TABLE public.photos ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.photos ADD COLUMN featured_order INTEGER;

-- Create index for better performance
CREATE INDEX idx_photos_featured ON public.photos(is_featured, featured_order) WHERE is_featured = true;

-- Add RLS policy for public viewing of featured photos (so all users can see default carousel)
CREATE POLICY "Featured photos are viewable by everyone"
ON public.photos
FOR SELECT
USING (is_featured = true);

-- Add comment explaining the featured system
COMMENT ON COLUMN public.photos.is_featured IS 'When true, this photo appears in the default carousel for users without their own photos';
COMMENT ON COLUMN public.photos.featured_order IS 'Display order for featured photos in the carousel (lower numbers show first)';
