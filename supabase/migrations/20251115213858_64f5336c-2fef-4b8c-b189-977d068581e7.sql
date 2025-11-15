-- Add thumbnail_path column to photos table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'photos' 
    AND column_name = 'thumbnail_path'
  ) THEN
    ALTER TABLE public.photos ADD COLUMN thumbnail_path text;
  END IF;
END $$;