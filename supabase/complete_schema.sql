-- ============================================================================
-- PulseGuard Complete Database Schema
-- ============================================================================
-- This file contains all tables, RLS policies, triggers, and functions
-- Run this in your Supabase SQL Editor to ensure all tables and policies exist
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- Create condition type enum (only if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE condition_type AS ENUM (
    'asthma',
    'sickle_cell_disease',
    'epilepsy',
    'diabetes',
    'heart_condition',
    'allergies',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- BASE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  -- ALARA Personality (added in alara_personality_schema.sql)
  alara_personality TEXT CHECK (alara_personality IS NULL OR alara_personality IN ('friendly', 'sassy', 'rude', 'fun_nurse', 'professional', 'caring')),
  -- Theme and notification preferences (added in theme_schema.sql)
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  medication_reminders_enabled BOOLEAN DEFAULT true,
  check_in_reminders_enabled BOOLEAN DEFAULT true,
  emergency_alerts_enabled BOOLEAN DEFAULT true,
  location_tracking_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User medical profiles
CREATE TABLE IF NOT EXISTS public.medical_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  condition_type condition_type NOT NULL,
  condition_name TEXT,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  diagnosis_date DATE,
  medications JSONB,
  triggers JSONB,
  emergency_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'poor', 'crisis')),
  symptoms JSONB,
  medication_taken BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Emergency events
CREATE TABLE IF NOT EXISTS public.emergency_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('panic_button', 'detected_pattern', 'manual')),
  location JSONB,
  sms_content TEXT,
  sms_sent_to TEXT[],
  ai_analysis JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health tracking entries
CREATE TABLE IF NOT EXISTS public.health_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('symptom', 'medication', 'vital', 'note')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('medication', 'check_in', 'appointment')),
  time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACTIVITY LOGS TABLE
-- ============================================================================

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

-- ============================================================================
-- ALARA CHAT MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alara_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_alara BOOLEAN NOT NULL DEFAULT false,
  emoji TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATION SUMMARIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  summary_text TEXT NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- LOCATION CIRCLES TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.location_circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.location_circle_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_circle_id UUID REFERENCES public.location_circles(id) ON DELETE CASCADE NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CARE & APPOINTMENTS TABLES
-- ============================================================================

-- Healthcare Providers
CREATE TABLE IF NOT EXISTS public.healthcare_providers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('doctor', 'hospital', 'clinic', 'specialist', 'therapist', 'other')),
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'NG',
  location JSONB,
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.healthcare_providers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  appointment_type TEXT CHECK (appointment_type IN ('checkup', 'followup', 'consultation', 'procedure', 'surgery', 'therapy', 'emergency', 'other')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  timezone TEXT DEFAULT 'UTC',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  location_type TEXT CHECK (location_type IN ('in_person', 'virtual', 'phone')),
  location_address TEXT,
  reason TEXT,
  preparation_notes TEXT,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Care Logs
CREATE TABLE IF NOT EXISTS public.care_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.healthcare_providers(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('visit', 'procedure', 'test', 'diagnosis', 'treatment', 'hospital_stay', 'emergency_visit', 'therapy_session', 'other')),
  title TEXT NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  diagnosis TEXT,
  treatment TEXT,
  medications_prescribed JSONB,
  test_results JSONB,
  symptoms_reported JSONB,
  location_type TEXT CHECK (location_type IN ('in_person', 'virtual', 'phone', 'hospital', 'clinic', 'emergency_room')),
  location_name TEXT,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood Pressure Logs
CREATE TABLE IF NOT EXISTS public.blood_pressure_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  systolic INTEGER NOT NULL CHECK (systolic > 0 AND systolic <= 300),
  diastolic INTEGER NOT NULL CHECK (diastolic > 0 AND diastolic <= 200),
  pulse INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  position TEXT CHECK (position IN ('sitting', 'standing', 'lying', 'other')),
  is_abnormal BOOLEAN DEFAULT FALSE,
  abnormal_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical Checkups
CREATE TABLE IF NOT EXISTS public.medical_checkups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  interval_months INTEGER NOT NULL DEFAULT 3 CHECK (interval_months > 0 AND interval_months <= 24),
  last_checkup_date DATE,
  next_checkup_date DATE,
  reminder_1_week_sent BOOLEAN DEFAULT FALSE,
  reminder_due_date_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Doctor Visit Reminders
CREATE TABLE IF NOT EXISTS public.doctor_visit_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_name TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  visit_date DATE,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hospital_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  patient_card_id TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical Dates
CREATE TABLE IF NOT EXISTS public.clinical_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  clinical_date DATE NOT NULL,
  description TEXT NOT NULL,
  clinical_type TEXT CHECK (clinical_type IN ('lab_test', 'scan', 'procedure', 'follow_up', 'screening', 'other')),
  location TEXT,
  provider_name TEXT,
  preparation_notes TEXT,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_1_day_sent BOOLEAN DEFAULT FALSE,
  reminder_1_week_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Base tables indexes
CREATE INDEX IF NOT EXISTS idx_medical_profiles_user_id ON public.medical_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.check_ins(date);
CREATE INDEX IF NOT EXISTS idx_emergency_events_user_id ON public.emergency_events(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_events_created_at ON public.emergency_events(created_at);
CREATE INDEX IF NOT EXISTS idx_health_entries_user_id ON public.health_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_health_entries_created_at ON public.health_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_is_active ON public.reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_alara_personality ON public.profiles(alara_personality);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON public.activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, date DESC);

-- ALARA chat messages indexes
CREATE INDEX IF NOT EXISTS idx_alara_chat_messages_user_id ON public.alara_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_alara_chat_messages_created_at ON public.alara_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alara_chat_messages_user_created ON public.alara_chat_messages(user_id, created_at DESC);

-- Conversation summaries indexes
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON public.conversation_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_last_updated ON public.conversation_summaries(last_updated DESC);

-- Location circles indexes
CREATE INDEX IF NOT EXISTS idx_location_circles_user_id ON public.location_circles(user_id);
CREATE INDEX IF NOT EXISTS idx_location_circles_is_active ON public.location_circles(is_active);
CREATE INDEX IF NOT EXISTS idx_location_circle_contacts_circle_id ON public.location_circle_contacts(location_circle_id);

-- Healthcare providers indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_user_id ON public.healthcare_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_type ON public.healthcare_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_is_primary ON public.healthcare_providers(user_id, is_primary) WHERE is_primary = TRUE;

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_scheduled ON public.appointments(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON public.appointments(user_id, scheduled_at) WHERE status IN ('scheduled', 'confirmed');

-- Care logs indexes
CREATE INDEX IF NOT EXISTS idx_care_logs_user_id ON public.care_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_provider_id ON public.care_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_appointment_id ON public.care_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_occurred_at ON public.care_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_care_logs_log_type ON public.care_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_care_logs_user_occurred ON public.care_logs(user_id, occurred_at DESC);

-- Blood pressure logs indexes
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_user_id ON public.blood_pressure_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_recorded_at ON public.blood_pressure_logs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_user_recorded ON public.blood_pressure_logs(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_abnormal ON public.blood_pressure_logs(user_id, is_abnormal) WHERE is_abnormal = TRUE;

-- Medical checkups indexes
CREATE INDEX IF NOT EXISTS idx_medical_checkups_user_id ON public.medical_checkups(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_checkups_next_date ON public.medical_checkups(next_checkup_date);
CREATE INDEX IF NOT EXISTS idx_medical_checkups_due_soon ON public.medical_checkups(user_id, next_checkup_date) WHERE next_checkup_date IS NOT NULL;

-- Doctor visit reminders indexes
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_user_id ON public.doctor_visit_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_reminder_date ON public.doctor_visit_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_is_completed ON public.doctor_visit_reminders(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_upcoming ON public.doctor_visit_reminders(user_id, reminder_date) WHERE is_completed = FALSE;

-- Hospitals indexes
CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON public.hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_is_primary ON public.hospitals(user_id, is_primary) WHERE is_primary = TRUE;

-- Clinical dates indexes
CREATE INDEX IF NOT EXISTS idx_clinical_dates_user_id ON public.clinical_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_dates_clinical_date ON public.clinical_dates(clinical_date);
CREATE INDEX IF NOT EXISTS idx_clinical_dates_is_completed ON public.clinical_dates(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_clinical_dates_upcoming ON public.clinical_dates(user_id, clinical_date) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_clinical_dates_reminders ON public.clinical_dates(user_id, clinical_date, reminder_enabled) WHERE is_completed = FALSE AND reminder_enabled = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - ENABLE ON ALL TABLES
-- ============================================================================

-- Enable RLS on all tables (safe to run multiple times)
DO $$ BEGIN
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.health_entries ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.alara_chat_messages ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.location_circles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.location_circle_contacts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.blood_pressure_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.medical_checkups ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.doctor_visit_reminders ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.clinical_dates ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Medical Profiles Policies
DROP POLICY IF EXISTS "Users can view own medical profiles" ON public.medical_profiles;
CREATE POLICY "Users can view own medical profiles"
  ON public.medical_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own medical profiles" ON public.medical_profiles;
CREATE POLICY "Users can insert own medical profiles"
  ON public.medical_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own medical profiles" ON public.medical_profiles;
CREATE POLICY "Users can update own medical profiles"
  ON public.medical_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own medical profiles" ON public.medical_profiles;
CREATE POLICY "Users can delete own medical profiles"
  ON public.medical_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Check-ins Policies
DROP POLICY IF EXISTS "Users can manage own check-ins" ON public.check_ins;
CREATE POLICY "Users can manage own check-ins"
  ON public.check_ins FOR ALL
  USING (auth.uid() = user_id);

-- Emergency Events Policies
DROP POLICY IF EXISTS "Users can manage own emergency events" ON public.emergency_events;
CREATE POLICY "Users can manage own emergency events"
  ON public.emergency_events FOR ALL
  USING (auth.uid() = user_id);

-- Health Entries Policies
DROP POLICY IF EXISTS "Users can manage own health entries" ON public.health_entries;
CREATE POLICY "Users can manage own health entries"
  ON public.health_entries FOR ALL
  USING (auth.uid() = user_id);

-- Reminders Policies
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
CREATE POLICY "Users can manage own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id);

-- Activity Logs Policies
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activity logs" ON public.activity_logs;
CREATE POLICY "Users can update own activity logs"
  ON public.activity_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activity logs" ON public.activity_logs;
CREATE POLICY "Users can delete own activity logs"
  ON public.activity_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ALARA Chat Messages Policies
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.alara_chat_messages;
CREATE POLICY "Users can view their own chat messages"
  ON public.alara_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.alara_chat_messages;
CREATE POLICY "Users can insert their own chat messages"
  ON public.alara_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.alara_chat_messages;
CREATE POLICY "Users can delete their own chat messages"
  ON public.alara_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.alara_chat_messages;
CREATE POLICY "Users can update their own chat messages"
  ON public.alara_chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Conversation Summaries Policies
DROP POLICY IF EXISTS "Users can view own conversation summaries" ON public.conversation_summaries;
CREATE POLICY "Users can view own conversation summaries"
  ON public.conversation_summaries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversation summaries" ON public.conversation_summaries;
CREATE POLICY "Users can insert own conversation summaries"
  ON public.conversation_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversation summaries" ON public.conversation_summaries;
CREATE POLICY "Users can update own conversation summaries"
  ON public.conversation_summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversation summaries" ON public.conversation_summaries;
CREATE POLICY "Users can delete own conversation summaries"
  ON public.conversation_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- Location Circles Policies
DROP POLICY IF EXISTS "Users can view own location circles" ON public.location_circles;
CREATE POLICY "Users can view own location circles"
  ON public.location_circles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own location circles" ON public.location_circles;
CREATE POLICY "Users can insert own location circles"
  ON public.location_circles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own location circles" ON public.location_circles;
CREATE POLICY "Users can update own location circles"
  ON public.location_circles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own location circles" ON public.location_circles;
CREATE POLICY "Users can delete own location circles"
  ON public.location_circles FOR DELETE
  USING (auth.uid() = user_id);

-- Location Circle Contacts Policies
DROP POLICY IF EXISTS "Users can view contacts for own location circles" ON public.location_circle_contacts;
CREATE POLICY "Users can view contacts for own location circles"
  ON public.location_circle_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert contacts for own location circles" ON public.location_circle_contacts;
CREATE POLICY "Users can insert contacts for own location circles"
  ON public.location_circle_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update contacts for own location circles" ON public.location_circle_contacts;
CREATE POLICY "Users can update contacts for own location circles"
  ON public.location_circle_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete contacts for own location circles" ON public.location_circle_contacts;
CREATE POLICY "Users can delete contacts for own location circles"
  ON public.location_circle_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.location_circles
      WHERE location_circles.id = location_circle_contacts.location_circle_id
      AND location_circles.user_id = auth.uid()
    )
  );

-- Healthcare Providers Policies
DROP POLICY IF EXISTS "Users can manage own healthcare providers" ON public.healthcare_providers;
CREATE POLICY "Users can manage own healthcare providers"
  ON public.healthcare_providers FOR ALL
  USING (auth.uid() = user_id);

-- Appointments Policies
DROP POLICY IF EXISTS "Users can manage own appointments" ON public.appointments;
CREATE POLICY "Users can manage own appointments"
  ON public.appointments FOR ALL
  USING (auth.uid() = user_id);

-- Care Logs Policies
DROP POLICY IF EXISTS "Users can manage own care logs" ON public.care_logs;
CREATE POLICY "Users can manage own care logs"
  ON public.care_logs FOR ALL
  USING (auth.uid() = user_id);

-- Blood Pressure Logs Policies
DROP POLICY IF EXISTS "Users can manage own blood pressure logs" ON public.blood_pressure_logs;
CREATE POLICY "Users can manage own blood pressure logs"
  ON public.blood_pressure_logs FOR ALL
  USING (auth.uid() = user_id);

-- Medical Checkups Policies
DROP POLICY IF EXISTS "Users can manage own medical checkups" ON public.medical_checkups;
CREATE POLICY "Users can manage own medical checkups"
  ON public.medical_checkups FOR ALL
  USING (auth.uid() = user_id);

-- Doctor Visit Reminders Policies
DROP POLICY IF EXISTS "Users can manage own doctor visit reminders" ON public.doctor_visit_reminders;
CREATE POLICY "Users can manage own doctor visit reminders"
  ON public.doctor_visit_reminders FOR ALL
  USING (auth.uid() = user_id);

-- Hospitals Policies
DROP POLICY IF EXISTS "Users can manage own hospitals" ON public.hospitals;
CREATE POLICY "Users can manage own hospitals"
  ON public.hospitals FOR ALL
  USING (auth.uid() = user_id);

-- Clinical Dates Policies
DROP POLICY IF EXISTS "Users can manage own clinical dates" ON public.clinical_dates;
CREATE POLICY "Users can manage own clinical dates"
  ON public.clinical_dates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update activity logs updated_at
CREATE OR REPLACE FUNCTION update_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update ALARA chat messages updated_at
CREATE OR REPLACE FUNCTION update_alara_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation summaries last_updated
CREATE OR REPLACE FUNCTION update_conversation_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming appointments count
CREATE OR REPLACE FUNCTION get_upcoming_appointments_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.appointments
    WHERE user_id = p_user_id
      AND status IN ('scheduled', 'confirmed')
      AND scheduled_at >= NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent care logs count
CREATE OR REPLACE FUNCTION get_recent_care_logs_count(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.care_logs
    WHERE user_id = p_user_id
      AND occurred_at >= NOW() - (p_days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next checkup date
CREATE OR REPLACE FUNCTION calculate_next_checkup_date(
  p_last_date DATE,
  p_interval_months INTEGER
)
RETURNS DATE AS $$
BEGIN
  IF p_last_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN p_last_date + (p_interval_months || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update next checkup date
CREATE OR REPLACE FUNCTION update_next_checkup_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_checkup_date IS NOT NULL THEN
    NEW.next_checkup_date := calculate_next_checkup_date(NEW.last_checkup_date, NEW.interval_months);
  ELSE
    NEW.next_checkup_date := NULL;
  END IF;
  
  -- Reset reminder flags when checkup date is updated
  IF OLD.last_checkup_date IS DISTINCT FROM NEW.last_checkup_date THEN
    NEW.reminder_1_week_sent := FALSE;
    NEW.reminder_due_date_sent := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure only one primary hospital per user
CREATE OR REPLACE FUNCTION ensure_single_primary_hospital()
RETURNS TRIGGER AS $$
BEGIN
  -- If this hospital is being set as primary, unset all other primary hospitals for this user
  IF NEW.is_primary = TRUE THEN
    UPDATE public.hospitals
    SET is_primary = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Triggers for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_profiles_updated_at ON public.medical_profiles;
CREATE TRIGGER update_medical_profiles_updated_at BEFORE UPDATE ON public.medical_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON public.activity_logs;
CREATE TRIGGER update_activity_logs_updated_at
  BEFORE UPDATE ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_logs_updated_at();

DROP TRIGGER IF EXISTS update_alara_chat_messages_updated_at ON public.alara_chat_messages;
CREATE TRIGGER update_alara_chat_messages_updated_at
  BEFORE UPDATE ON public.alara_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_alara_chat_messages_updated_at();

DROP TRIGGER IF EXISTS update_conversation_summaries_updated_at ON public.conversation_summaries;
CREATE TRIGGER update_conversation_summaries_updated_at
  BEFORE UPDATE ON public.conversation_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_summaries_updated_at();

DROP TRIGGER IF EXISTS update_location_circles_updated_at ON public.location_circles;
CREATE TRIGGER update_location_circles_updated_at
  BEFORE UPDATE ON public.location_circles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_healthcare_providers_updated_at ON public.healthcare_providers;
CREATE TRIGGER update_healthcare_providers_updated_at 
  BEFORE UPDATE ON public.healthcare_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_care_logs_updated_at ON public.care_logs;
CREATE TRIGGER update_care_logs_updated_at 
  BEFORE UPDATE ON public.care_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blood_pressure_logs_updated_at ON public.blood_pressure_logs;
CREATE TRIGGER update_blood_pressure_logs_updated_at 
  BEFORE UPDATE ON public.blood_pressure_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_checkups_updated_at ON public.medical_checkups;
CREATE TRIGGER update_medical_checkups_updated_at 
  BEFORE UPDATE ON public.medical_checkups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_visit_reminders_updated_at ON public.doctor_visit_reminders;
CREATE TRIGGER update_doctor_visit_reminders_updated_at 
  BEFORE UPDATE ON public.doctor_visit_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hospitals_updated_at ON public.hospitals;
CREATE TRIGGER update_hospitals_updated_at 
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinical_dates_updated_at ON public.clinical_dates;
CREATE TRIGGER update_clinical_dates_updated_at 
  BEFORE UPDATE ON public.clinical_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-calculate next_checkup_date
DROP TRIGGER IF EXISTS trigger_update_next_checkup_date ON public.medical_checkups;
CREATE TRIGGER trigger_update_next_checkup_date
  BEFORE INSERT OR UPDATE ON public.medical_checkups
  FOR EACH ROW
  EXECUTE FUNCTION update_next_checkup_date();

-- Trigger to ensure only one primary hospital
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_hospital ON public.hospitals;
CREATE TRIGGER trigger_ensure_single_primary_hospital
  BEFORE INSERT OR UPDATE ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_hospital();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
