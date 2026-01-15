-- Add theme preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Add notification preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS medication_reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS check_in_reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS emergency_alerts_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS location_tracking_enabled BOOLEAN DEFAULT true;
