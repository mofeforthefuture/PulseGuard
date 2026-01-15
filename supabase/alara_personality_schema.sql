-- ALARA Personality Customization Schema
-- Run this in your Supabase SQL Editor

-- Add personality preference to profiles table (NULL means not set yet)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS alara_personality TEXT 
CHECK (alara_personality IS NULL OR alara_personality IN ('friendly', 'sassy', 'rude', 'fun_nurse', 'professional', 'caring'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_alara_personality ON public.profiles(alara_personality);
