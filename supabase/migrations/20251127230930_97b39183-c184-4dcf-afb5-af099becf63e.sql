-- Add quality threshold setting to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS vault_quality_threshold numeric NOT NULL DEFAULT 7.0;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.vault_quality_threshold IS 'Minimum score (0-10) required for a photo to be uploaded to vault';