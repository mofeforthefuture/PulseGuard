-- Location Circles Schema
-- Add this to your Supabase SQL Editor

-- Location circles table
CREATE TABLE IF NOT EXISTS public.location_circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100, -- in meters
  icon TEXT, -- emoji or icon identifier
  color TEXT, -- hex color code
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location circle contacts (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.location_circle_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_circle_id UUID REFERENCES public.location_circles(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_circles_user_id ON public.location_circles(user_id);
CREATE INDEX IF NOT EXISTS idx_location_circles_is_active ON public.location_circles(is_active);
CREATE INDEX IF NOT EXISTS idx_location_circle_contacts_circle_id ON public.location_circle_contacts(location_circle_id);

-- Enable RLS
ALTER TABLE public.location_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_circle_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_circles
CREATE POLICY "Users can view own location circles"
  ON public.location_circles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location circles"
  ON public.location_circles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location circles"
  ON public.location_circles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own location circles"
  ON public.location_circles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for location_circle_contacts
CREATE POLICY "Users can view contacts for own location circles"
  ON public.location_circle_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts for own location circles"
  ON public.location_circle_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts for own location circles"
  ON public.location_circle_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts for own location circles"
  ON public.location_circle_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_location_circles_updated_at
  BEFORE UPDATE ON public.location_circles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
