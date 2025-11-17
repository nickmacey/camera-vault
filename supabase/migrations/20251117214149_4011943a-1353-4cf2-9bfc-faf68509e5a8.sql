-- 1. CREATE CONNECTED PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS connected_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  display_name TEXT,
  
  -- OAuth credentials (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  
  -- Connection status
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  auto_sync_frequency TEXT DEFAULT 'daily',
  
  -- Statistics
  photo_count INTEGER DEFAULT 0,
  analyzed_count INTEGER DEFAULT 0,
  vault_worthy_count INTEGER DEFAULT 0,
  
  -- Provider-specific settings
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

ALTER TABLE connected_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own providers"
  ON connected_providers FOR ALL
  USING (auth.uid() = user_id);

-- 2. ADD NEW COLUMNS TO PHOTOS TABLE
ALTER TABLE photos 
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'manual_upload',
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES connected_providers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS orientation TEXT,
  ADD COLUMN IF NOT EXISTS date_taken TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS camera_data JSONB,
  ADD COLUMN IF NOT EXISTS location_data JSONB,
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS user_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_tags TEXT[],
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- Add unique constraint for provider + external_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_provider_external 
  ON photos(provider_id, external_id) 
  WHERE provider_id IS NOT NULL AND external_id IS NOT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_photos_provider ON photos(provider);
CREATE INDEX IF NOT EXISTS idx_photos_date_taken ON photos(date_taken DESC);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite) WHERE is_favorite = true;

-- 3. CREATE SYNC JOBS TABLE
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES connected_providers(id) ON DELETE CASCADE NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'complete', 'failed')),
  
  -- Progress tracking
  total_photos INTEGER,
  processed_photos INTEGER DEFAULT 0,
  vault_worthy_found INTEGER DEFAULT 0,
  high_value_found INTEGER DEFAULT 0,
  archived_found INTEGER DEFAULT 0,
  
  -- Configuration
  filters JSONB DEFAULT '{}',
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_error_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sync jobs"
  ON sync_jobs FOR ALL
  USING (auth.uid() = user_id);

-- 4. UPDATE USER SETTINGS TABLE
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS auto_generate_captions BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_analyze_uploads BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"sync_complete": true, "vault_worthy_found": true}';

-- Update trigger for connected_providers
CREATE TRIGGER update_connected_providers_updated_at
  BEFORE UPDATE ON connected_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for sync_jobs
CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();