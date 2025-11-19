-- Add file_hash column to photos table for duplicate detection
ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_hash text;

-- Create index on file_hash for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_photos_file_hash ON photos(file_hash);

-- Create index on user_id and file_hash for user-specific duplicate checks
CREATE INDEX IF NOT EXISTS idx_photos_user_file_hash ON photos(user_id, file_hash);