-- ALARA Chat Messages Table
-- Stores chat history between users and ALARA

CREATE TABLE IF NOT EXISTS alara_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_alara BOOLEAN NOT NULL DEFAULT false,
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alara_chat_messages_user_id ON alara_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_alara_chat_messages_created_at ON alara_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alara_chat_messages_user_created ON alara_chat_messages(user_id, created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_alara_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alara_chat_messages_updated_at
  BEFORE UPDATE ON alara_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_alara_chat_messages_updated_at();

-- Row Level Security (RLS)
ALTER TABLE alara_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own messages
CREATE POLICY "Users can view their own chat messages"
  ON alara_chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert their own chat messages"
  ON alara_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own chat messages"
  ON alara_chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Users can update their own messages (for editing)
CREATE POLICY "Users can update their own chat messages"
  ON alara_chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
