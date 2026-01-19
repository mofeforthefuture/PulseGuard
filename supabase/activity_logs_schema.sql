-- Activity Logs Schema
-- Tracks daily step counts and activity data

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  steps_count INTEGER NOT NULL DEFAULT 0,
  activity_notes TEXT,
  source TEXT CHECK (source IN ('device', 'manual')) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON public.activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, date DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON public.activity_logs;

CREATE TRIGGER update_activity_logs_updated_at
  BEFORE UPDATE ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_logs_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activity logs" ON public.activity_logs;
CREATE POLICY "Users can update own activity logs"
  ON public.activity_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activity logs" ON public.activity_logs;
CREATE POLICY "Users can delete own activity logs"
  ON public.activity_logs
  FOR DELETE
  USING (auth.uid() = user_id);
