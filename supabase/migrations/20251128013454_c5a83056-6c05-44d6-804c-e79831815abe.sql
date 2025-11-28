-- Add edited_storage_path to track edited versions of photos
ALTER TABLE public.photos 
ADD COLUMN edited_storage_path text,
ADD COLUMN edited_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.photos.edited_storage_path IS 'Storage path for the edited version of the photo';
COMMENT ON COLUMN public.photos.edited_at IS 'Timestamp when the photo was last edited';