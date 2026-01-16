-- Conversation Summary Table
-- Stores AI-generated summaries of conversations for ALARA's memory system
-- Updated every 5-10 messages to capture patterns and context

CREATE TABLE IF NOT EXISTS public.conversation_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  summary_text TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0, -- Number of messages since last summary
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- One summary per user
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON public.conversation_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_last_updated ON public.conversation_summaries(last_updated DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_conversation_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_summaries_updated_at
  BEFORE UPDATE ON public.conversation_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_summaries_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own summaries
CREATE POLICY "Users can view own conversation summaries"
  ON public.conversation_summaries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own summaries
CREATE POLICY "Users can insert own conversation summaries"
  ON public.conversation_summaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own summaries
CREATE POLICY "Users can update own conversation summaries"
  ON public.conversation_summaries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own summaries
CREATE POLICY "Users can delete own conversation summaries"
  ON public.conversation_summaries
  FOR DELETE
  USING (auth.uid() = user_id);
