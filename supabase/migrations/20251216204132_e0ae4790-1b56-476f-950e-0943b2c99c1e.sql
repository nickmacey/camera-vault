-- Add lens_profile column to profiles table to persist the Through My Lens analysis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lens_profile jsonb DEFAULT NULL;

-- Add lens_story column for the first-person narrative version
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lens_story text DEFAULT NULL;

-- Add lens_updated_at to track when the profile was last generated
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lens_updated_at timestamp with time zone DEFAULT NULL;