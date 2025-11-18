-- Create thumbnails storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for sync_jobs table
ALTER TABLE sync_jobs REPLICA IDENTITY FULL;

-- Add sync_jobs to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'sync_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sync_jobs;
  END IF;
END $$;