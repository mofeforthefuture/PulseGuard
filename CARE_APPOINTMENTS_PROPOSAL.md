# Care & Appointments Module Proposal

## 📋 Overview

The **Care & Appointments** module will serve as a comprehensive medical timeline and healthcare provider management system. It will track all doctor visits, hospital stays, clinical appointments, and related medical events in a structured, chronological format.

---

## 📁 Folder Structure

Following the existing codebase patterns, the module will be organized as follows:

```
pulseguard/
├── app/
│   └── (tabs)/
│       └── care.tsx                    # Main Care & Appointments dashboard
│
├── src/
│   ├── components/
│   │   └── care/
│   │       ├── index.ts                # Component exports
│   │       ├── README.md               # Component documentation
│   │       ├── CareDashboardScreen.tsx # Main dashboard component
│   │       ├── UpcomingAppointmentsCard.tsx
│   │       ├── AppointmentCard.tsx
│   │       ├── CareLogCard.tsx
│   │       ├── ProviderCard.tsx
│   │       ├── TimelineView.tsx        # Medical timeline visualization
│   │       ├── AddAppointmentModal.tsx
│   │       ├── AddCareLogModal.tsx
│   │       ├── AddProviderModal.tsx
│   │       ├── EditAppointmentModal.tsx
│   │       └── AppointmentDetailsModal.tsx
│   │
│   ├── lib/
│   │   └── services/
│   │       ├── careService.ts          # CRUD operations for appointments & logs
│   │       └── providerService.ts      # Healthcare provider management
│   │
│   └── types/
│       └── care.ts                    # TypeScript types for care module
```

---

## 🧭 Navigation Placement

### Primary Tab Navigation

Add **"Care"** as a new tab in the bottom navigation bar, replacing "Medications" and positioned between "Emergency" and "Profile":

```typescript
// app/(tabs)/_layout.tsx
<Tabs.Screen
  name="care"
  options={{
    title: 'Care',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="medical-outline" size={size || 24} color={color} />
    ),
  }}
/>

// Medications is now hidden from tabs and accessible from Care module
<Tabs.Screen
  name="medications"
  options={{
    href: null, // Hide from tab bar - accessible from Care module
  }}
/>
```

### Navigation Structure

```
Tab Navigator
├── Home (index)
├── Emergency
├── Care ⭐ NEW (replaces Medications tab)
│   ├── Medications (hidden route, accessible from Care)
│   ├── Dashboard (default view)
│   │   ├── Upcoming Appointments Summary
│   │   ├── Recent Care Logs
│   │   ├── Healthcare Providers List
│   │   └── Quick Actions (Add Appointment, Add Log, Add Provider)
│   │
│   ├── Appointments (stack navigation)
│   │   ├── List View
│   │   ├── Calendar View
│   │   ├── Add/Edit Appointment
│   │   └── Appointment Details
│   │
│   ├── Care Logs (stack navigation)
│   │   ├── Timeline View
│   │   ├── List View
│   │   ├── Add/Edit Log
│   │   └── Log Details
│   │
│   └── Providers (stack navigation)
│       ├── Provider List
│       ├── Add/Edit Provider
│       └── Provider Details
│
└── Profile
```

### Screen Access Pattern

- **Main Dashboard**: `/(tabs)/care` (default route)
- **Appointments List**: `/(tabs)/care/appointments` (hidden from tabs, accessible via dashboard)
- **Care Logs Timeline**: `/(tabs)/care/logs` (hidden from tabs, accessible via dashboard)
- **Providers List**: `/(tabs)/care/providers` (hidden from tabs, accessible via dashboard)

---

## 🗄️ Supabase Tables Required

### 1. Healthcare Providers Table

Stores information about doctors, hospitals, clinics, and other healthcare facilities.

```sql
-- Healthcare providers (doctors, hospitals, clinics)
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
  country TEXT DEFAULT 'US',
  location JSONB, -- {lat, lng} for mapping
  
  -- Additional Details
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE, -- Mark primary care provider
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_user_id ON public.healthcare_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_type ON public.healthcare_providers(provider_type);
```

### 2. Appointments Table

Tracks scheduled and past medical appointments.

```sql
-- Medical appointments
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_scheduled ON public.appointments(user_id, scheduled_at);
```

### 3. Care Logs Table

Records past medical events, visits, procedures, and clinical interactions (historical timeline).

```sql
-- Care logs (historical medical events)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_care_logs_user_id ON public.care_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_provider_id ON public.care_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_appointment_id ON public.care_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_occurred_at ON public.care_logs(occurred_at);
CREATE INDEX IF NOT EXISTS idx_care_logs_log_type ON public.care_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_care_logs_user_occurred ON public.care_logs(user_id, occurred_at DESC);
```

---

## 🔒 Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;

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
```

---

## 🔄 Triggers for updated_at

```sql
-- Triggers for automatic updated_at updates
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
```

---

## 📊 Data Relationships

```
profiles (user)
  ├── healthcare_providers (1:N)
  │     └── appointments (1:N)
  │     └── care_logs (1:N)
  ├── appointments (1:N)
  │     └── care_logs (1:1, optional) - links appointment to log entry
  └── care_logs (1:N)
```

**Key Relationships:**
- A user can have multiple healthcare providers
- A provider can have multiple appointments and care logs
- An appointment can optionally link to a care log (when appointment is completed)
- Care logs can exist independently (for past events not scheduled as appointments)

---

## 🎯 Key Features

### Dashboard View
- **Upcoming Appointments Summary**: Next 3-5 appointments with countdown
- **Recent Care Logs**: Last 5-10 medical events in reverse chronological order
- **Providers Quick Access**: List of all healthcare providers with quick contact
- **Quick Actions**: Buttons to add new appointment, log, or provider

### Timeline View
- **Chronological Medical Timeline**: All appointments and care logs in one unified timeline
- **Visual Separation**: Clear distinction between:
  - **Scheduled** (appointments) - future events
  - **Completed** (care logs) - past events
- **Filtering**: By provider, date range, type, status
- **Search**: Full-text search across titles, notes, diagnoses

### Appointment Management
- **Calendar Integration**: View appointments in calendar format
- **Status Tracking**: Scheduled → Confirmed → Completed/Cancelled
- **Reminders**: Integration with existing reminders system
- **Recurring Appointments**: Support for regular check-ups

### Care Log Management
- **Rich Event Details**: Diagnosis, treatment, medications, test results
- **Attachment Support**: Store documents, images, test results
- **Provider Linking**: Link logs to providers and appointments
- **Follow-up Tracking**: Mark and track required follow-ups

---

## 🔗 Integration Points

### With Existing Modules

1. **Reminders System**: 
   - Auto-create reminders for upcoming appointments
   - Link appointment reminders to the appointments table

2. **Medications Module**:
   - Link medications prescribed during appointments/care logs
   - Track medication changes over time

3. **Emergency Module**:
   - Link emergency visits as care logs
   - Track emergency room visits and urgent care

4. **ALARA Integration**:
   - ALARA can reference care history in context
   - Provide insights based on appointment patterns

5. **History Module**:
   - Care logs appear in overall health history
   - Unified timeline view

---

## 📝 Next Steps

1. **Review & Approve** this proposal
2. **Create Supabase Schema**: Run the SQL migrations
3. **Generate TypeScript Types**: Update `src/lib/supabase/types.ts`
4. **Create Type Definitions**: Implement `src/types/care.ts`
5. **Build Services**: Implement `careService.ts` and `providerService.ts`
6. **Create Components**: Build UI components following existing patterns
7. **Add Navigation**: Integrate into tab navigation
8. **Testing**: Unit tests and integration tests

---

## 🎨 Design Considerations

- **Timeline Visualization**: Use a vertical timeline similar to medication tracking
- **Color Coding**: 
  - Scheduled appointments: Primary/Info colors
  - Completed logs: Success/Calm colors
  - Cancelled: Warning colors
  - Emergency visits: Emergency colors
- **Card-based UI**: Follow existing Card component patterns
- **Empty States**: Friendly empty states with clear CTAs
- **Accessibility**: Large touch targets, VoiceOver support, high contrast

---

## 📚 Additional Notes

- **Privacy**: All data is user-scoped with RLS
- **Performance**: Indexes on common query patterns (user_id + date)
- **Scalability**: JSONB fields for flexible data storage
- **Future Enhancements**:
  - Calendar sync (iCal, Google Calendar)
  - Provider directory integration
  - Insurance claim tracking
  - Prescription refill reminders
  - Telehealth link integration
