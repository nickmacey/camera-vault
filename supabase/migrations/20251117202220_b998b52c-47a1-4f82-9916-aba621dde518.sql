-- Add new scoring columns to photos table
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS technical_score DECIMAL,
ADD COLUMN IF NOT EXISTS commercial_score DECIMAL,
ADD COLUMN IF NOT EXISTS artistic_score DECIMAL,
ADD COLUMN IF NOT EXISTS emotional_score DECIMAL,
ADD COLUMN IF NOT EXISTS overall_score DECIMAL,
ADD COLUMN IF NOT EXISTS tier TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS social_title TEXT,
ADD COLUMN IF NOT EXISTS instagram_caption TEXT,
ADD COLUMN IF NOT EXISTS twitter_caption TEXT,
ADD COLUMN IF NOT EXISTS linkedin_caption TEXT,
ADD COLUMN IF NOT EXISTS hashtags JSONB,
ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Create user_settings table for scoring weights and brand voice
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scoring weights
  technical_weight INTEGER NOT NULL DEFAULT 70,
  commercial_weight INTEGER NOT NULL DEFAULT 80,
  artistic_weight INTEGER NOT NULL DEFAULT 60,
  emotional_weight INTEGER NOT NULL DEFAULT 50,
  
  -- Brand voice settings
  tone TEXT NOT NULL DEFAULT 'poetic',
  style TEXT NOT NULL DEFAULT 'observer',
  personality TEXT[] NOT NULL DEFAULT ARRAY['reflective'],
  emoji_preference TEXT NOT NULL DEFAULT 'sparingly',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for user_settings updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();