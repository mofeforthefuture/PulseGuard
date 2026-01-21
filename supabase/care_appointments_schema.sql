-- Care & Appointments Module Schema
-- Run this in your Supabase SQL Editor after the main schema.sql

-- ============================================================================
-- HEALTHCARE PROVIDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.healthcare_providers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider Information
  provider_type TEXT NOT NULL CHECK (provider_type IN ('doctor', 'hospital', 'clinic', 'specialist', 'therapist', 'other')),
  name TEXT NOT NULL,
  specialty TEXT, -- e.g., "Cardiology", "General Practice", "Emergency Medicine"
  
  -- Contact Information
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Location
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'NG',
  location JSONB, -- {lat, lng} for mapping
  
  -- Additional Details
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE, -- Mark primary care provider
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.healthcare_providers(id) ON DELETE SET NULL,
  
  -- Appointment Details
  title TEXT NOT NULL, -- e.g., "Annual Check-up", "Follow-up Visit"
  appointment_type TEXT CHECK (appointment_type IN ('checkup', 'followup', 'consultation', 'procedure', 'surgery', 'therapy', 'emergency', 'other')),
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30, -- Appointment duration
  timezone TEXT DEFAULT 'UTC',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  
  -- Location
  location_type TEXT CHECK (location_type IN ('in_person', 'virtual', 'phone')),
  location_address TEXT, -- Override provider address if different
  
  -- Notes & Preparation
  reason TEXT, -- Reason for visit
  preparation_notes TEXT, -- Instructions before appointment
  notes TEXT, -- General notes
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CARE LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.care_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.healthcare_providers(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL, -- Link to appointment if applicable
  
  -- Log Details
  log_type TEXT NOT NULL CHECK (log_type IN ('visit', 'procedure', 'test', 'diagnosis', 'treatment', 'hospital_stay', 'emergency_visit', 'therapy_session', 'other')),
  title TEXT NOT NULL,
  
  -- Timing
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER, -- For procedures, hospital stays, etc.
  
  -- Medical Information
  diagnosis TEXT, -- Diagnosis or findings
  treatment TEXT, -- Treatment received
  medications_prescribed JSONB, -- Array of medication objects
  test_results JSONB, -- Test results or lab data
  symptoms_reported JSONB, -- Symptoms discussed
  
  -- Location
  location_type TEXT CHECK (location_type IN ('in_person', 'virtual', 'phone', 'hospital', 'clinic', 'emergency_room')),
  location_name TEXT, -- Facility name if different from provider
  
  -- Additional Details
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  
  -- Attachments (references to storage)
  attachments JSONB, -- Array of file references
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Healthcare Providers Indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_user_id ON public.healthcare_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_type ON public.healthcare_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_is_primary ON public.healthcare_providers(user_id, is_primary) WHERE is_primary = TRUE;

-- Appointments Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_scheduled ON public.appointments(user_id, scheduled_at);
-- Index for upcoming appointments (without NOW() since it's not immutable)
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON public.appointments(user_id, scheduled_at) WHERE status IN ('scheduled', 'confirmed');

-- Care Logs Indexes
CREATE INDEX IF NOT EXISTS idx_care_logs_user_id ON public.care_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_provider_id ON public.care_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_appointment_id ON public.care_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_occurred_at ON public.care_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_care_logs_log_type ON public.care_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_care_logs_user_occurred ON public.care_logs(user_id, occurred_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC updated_at
-- ============================================================================

-- Healthcare Providers Trigger
DROP TRIGGER IF EXISTS update_healthcare_providers_updated_at ON public.healthcare_providers;
CREATE TRIGGER update_healthcare_providers_updated_at 
  BEFORE UPDATE ON public.healthcare_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appointments Trigger
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Care Logs Trigger
DROP TRIGGER IF EXISTS update_care_logs_updated_at ON public.care_logs;
CREATE TRIGGER update_care_logs_updated_at 
  BEFORE UPDATE ON public.care_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS (Optional - for common queries)
-- ============================================================================

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

-- ============================================================================
-- BLOOD PRESSURE LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blood_pressure_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Blood Pressure Values
  systolic INTEGER NOT NULL CHECK (systolic > 0 AND systolic <= 300),
  diastolic INTEGER NOT NULL CHECK (diastolic > 0 AND diastolic <= 200),
  pulse INTEGER, -- Optional pulse reading
  
  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Additional Context
  notes TEXT,
  position TEXT CHECK (position IN ('sitting', 'standing', 'lying', 'other')),
  
  -- ALARA Flagging
  is_abnormal BOOLEAN DEFAULT FALSE,
  abnormal_reason TEXT, -- e.g., "high_systolic", "low_diastolic", "both"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Blood Pressure Logs
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_user_id ON public.blood_pressure_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_recorded_at ON public.blood_pressure_logs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_user_recorded ON public.blood_pressure_logs(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_blood_pressure_logs_abnormal ON public.blood_pressure_logs(user_id, is_abnormal) WHERE is_abnormal = TRUE;

-- Enable RLS for Blood Pressure Logs
DO $$ 
BEGIN
  ALTER TABLE public.blood_pressure_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Blood Pressure Logs Policies
DROP POLICY IF EXISTS "Users can manage own blood pressure logs" ON public.blood_pressure_logs;
CREATE POLICY "Users can manage own blood pressure logs"
  ON public.blood_pressure_logs FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_blood_pressure_logs_updated_at ON public.blood_pressure_logs;
CREATE TRIGGER update_blood_pressure_logs_updated_at 
  BEFORE UPDATE ON public.blood_pressure_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MEDICAL CHECKUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.medical_checkups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Checkup Settings
  interval_months INTEGER NOT NULL DEFAULT 3 CHECK (interval_months > 0 AND interval_months <= 24),
  
  -- Dates
  last_checkup_date DATE,
  next_checkup_date DATE, -- Calculated: last_checkup_date + interval_months
  
  -- Notification Settings
  reminder_1_week_sent BOOLEAN DEFAULT FALSE,
  reminder_due_date_sent BOOLEAN DEFAULT FALSE,
  
  -- Additional Info
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one checkup record per user
  UNIQUE(user_id)
);

-- Indexes for Medical Checkups
CREATE INDEX IF NOT EXISTS idx_medical_checkups_user_id ON public.medical_checkups(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_checkups_next_date ON public.medical_checkups(next_checkup_date);
CREATE INDEX IF NOT EXISTS idx_medical_checkups_due_soon ON public.medical_checkups(user_id, next_checkup_date) WHERE next_checkup_date IS NOT NULL;

-- Enable RLS for Medical Checkups
DO $$ 
BEGIN
  ALTER TABLE public.medical_checkups ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Medical Checkups Policies
DROP POLICY IF EXISTS "Users can manage own medical checkups" ON public.medical_checkups;
CREATE POLICY "Users can manage own medical checkups"
  ON public.medical_checkups FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_medical_checkups_updated_at ON public.medical_checkups;
CREATE TRIGGER update_medical_checkups_updated_at 
  BEFORE UPDATE ON public.medical_checkups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger to auto-calculate next_checkup_date when last_checkup_date or interval changes
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

DROP TRIGGER IF EXISTS trigger_update_next_checkup_date ON public.medical_checkups;
CREATE TRIGGER trigger_update_next_checkup_date
  BEFORE INSERT OR UPDATE ON public.medical_checkups
  FOR EACH ROW
  EXECUTE FUNCTION update_next_checkup_date();

-- ============================================================================
-- DOCTOR VISIT REMINDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.doctor_visit_reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Doctor Information
  doctor_name TEXT NOT NULL,
  
  -- Recommendation
  recommendation_text TEXT NOT NULL, -- Original text from doctor (e.g., "Return in 2 weeks")
  reminder_date DATE NOT NULL, -- Calculated date based on recommendation
  
  -- Visit Details
  visit_date DATE, -- When the visit occurred
  notes TEXT, -- Additional notes from the visit
  
  -- Status
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Reminder Tracking
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Doctor Visit Reminders
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_user_id ON public.doctor_visit_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_reminder_date ON public.doctor_visit_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_is_completed ON public.doctor_visit_reminders(user_id, is_completed);
-- Index for upcoming reminders (without CURRENT_DATE since it's not immutable - filter in queries)
CREATE INDEX IF NOT EXISTS idx_doctor_visit_reminders_upcoming ON public.doctor_visit_reminders(user_id, reminder_date) WHERE is_completed = FALSE;

-- Enable RLS for Doctor Visit Reminders
DO $$ 
BEGIN
  ALTER TABLE public.doctor_visit_reminders ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Doctor Visit Reminders Policies
DROP POLICY IF EXISTS "Users can manage own doctor visit reminders" ON public.doctor_visit_reminders;
CREATE POLICY "Users can manage own doctor visit reminders"
  ON public.doctor_visit_reminders FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_doctor_visit_reminders_updated_at ON public.doctor_visit_reminders;
CREATE TRIGGER update_doctor_visit_reminders_updated_at 
  BEFORE UPDATE ON public.doctor_visit_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HOSPITALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Hospital Information
  hospital_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  patient_card_id TEXT, -- Optional hospital card / patient ID number
  
  -- Primary Hospital Flag
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Additional Details
  address TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Hospitals
CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON public.hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_is_primary ON public.hospitals(user_id, is_primary) WHERE is_primary = TRUE;

-- Enable RLS for Hospitals
DO $$ 
BEGIN
  ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Hospitals Policies
DROP POLICY IF EXISTS "Users can manage own hospitals" ON public.hospitals;
CREATE POLICY "Users can manage own hospitals"
  ON public.hospitals FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_hospitals_updated_at ON public.hospitals;
CREATE TRIGGER update_hospitals_updated_at 
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Trigger to ensure only one primary hospital
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_hospital ON public.hospitals;
CREATE TRIGGER trigger_ensure_single_primary_hospital
  BEFORE INSERT OR UPDATE ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_hospital();

-- ============================================================================
-- CLINICAL DATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clinical_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Clinical Date Information
  clinical_date DATE NOT NULL,
  description TEXT NOT NULL,
  clinical_type TEXT CHECK (clinical_type IN ('lab_test', 'scan', 'procedure', 'follow_up', 'screening', 'other')),
  
  -- Location/Provider (Optional)
  location TEXT,
  provider_name TEXT,
  
  -- Preparation/Instructions
  preparation_notes TEXT,
  notes TEXT,
  
  -- Status
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Reminder Settings
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_1_day_sent BOOLEAN DEFAULT FALSE,
  reminder_1_week_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Clinical Dates
CREATE INDEX IF NOT EXISTS idx_clinical_dates_user_id ON public.clinical_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_dates_clinical_date ON public.clinical_dates(clinical_date);
CREATE INDEX IF NOT EXISTS idx_clinical_dates_is_completed ON public.clinical_dates(user_id, is_completed);
-- Index for upcoming clinical dates (without CURRENT_DATE since it's not immutable - filter in queries)
CREATE INDEX IF NOT EXISTS idx_clinical_dates_upcoming ON public.clinical_dates(user_id, clinical_date) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_clinical_dates_reminders ON public.clinical_dates(user_id, clinical_date, reminder_enabled) WHERE is_completed = FALSE AND reminder_enabled = TRUE;

-- Enable RLS for Clinical Dates
DO $$ 
BEGIN
  ALTER TABLE public.clinical_dates ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Clinical Dates Policies
DROP POLICY IF EXISTS "Users can manage own clinical dates" ON public.clinical_dates;
CREATE POLICY "Users can manage own clinical dates"
  ON public.clinical_dates FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_clinical_dates_updated_at ON public.clinical_dates;
CREATE TRIGGER update_clinical_dates_updated_at 
  BEFORE UPDATE ON public.clinical_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
