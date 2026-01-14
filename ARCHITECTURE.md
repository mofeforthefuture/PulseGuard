# PulseGuard Architecture Proposal

## 📁 Folder Structure

```
pulseguard/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                  # Auth group
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/                  # Main app tabs
│   │   ├── index.tsx           # Dashboard
│   │   ├── emergency.tsx       # Emergency screen
│   │   ├── history.tsx         # Crisis history
│   │   └── profile.tsx         # Medical profile
│   ├── _layout.tsx             # Root layout
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── SafeAreaView.tsx
│   │   ├── emergency/
│   │   │   ├── PanicButton.tsx
│   │   │   ├── LocationShare.tsx
│   │   │   └── SMSGenerator.tsx
│   │   ├── health/
│   │   │   ├── CheckInCard.tsx
│   │   │   ├── ConditionCard.tsx
│   │   │   └── ReminderCard.tsx
│   │   └── auth/
│   │       ├── AuthForm.tsx
│   │       └── OnboardingFlow.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Supabase client
│   │   │   ├── auth.ts          # Auth helpers
│   │   │   └── types.ts         # Database types
│   │   ├── ai/
│   │   │   ├── alara.ts         # ALARA AI integration
│   │   │   └── patterns.ts      # Danger pattern detection
│   │   ├── services/
│   │   │   ├── location.ts      # Location services
│   │   │   ├── sms.ts           # SMS generation
│   │   │   └── notifications.ts # Push notifications
│   │   └── utils/
│   │       ├── constants.ts
│   │       └── helpers.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useEmergency.ts
│   │   ├── useHealthData.ts
│   │   └── useLocation.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── EmergencyContext.tsx
│   └── types/
│       ├── user.ts
│       ├── health.ts
│       └── emergency.ts
├── assets/
│   ├── fonts/
│   └── images/
├── app.json
├── package.json
└── tsconfig.json
```

## 🗄️ Supabase Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical conditions
CREATE TYPE condition_type AS ENUM (
  'asthma',
  'sickle_cell_disease',
  'epilepsy',
  'diabetes',
  'heart_condition',
  'allergies',
  'other'
);

-- User medical profiles
CREATE TABLE public.medical_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  condition_type condition_type NOT NULL,
  condition_name TEXT,
  severity TEXT, -- mild, moderate, severe
  diagnosis_date DATE,
  medications JSONB, -- Array of medication objects
  triggers JSONB, -- Array of trigger strings
  emergency_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily check-ins
CREATE TABLE public.check_ins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT, -- great, good, okay, poor, crisis
  symptoms JSONB, -- Array of symptom objects
  medication_taken BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Emergency events
CREATE TABLE public.emergency_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- panic_button, detected_pattern, manual
  location JSONB, -- {lat, lng, address}
  sms_content TEXT,
  sms_sent_to TEXT[], -- Array of phone numbers
  ai_analysis JSONB, -- ALARA analysis data
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health tracking entries
CREATE TABLE public.health_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL, -- symptom, medication, vital, note
  data JSONB NOT NULL, -- Flexible data structure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders
CREATE TABLE public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL, -- medication, check_in, appointment
  time TIME NOT NULL,
  days_of_week INTEGER[], -- 0-6 (Sunday-Saturday)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Medical profiles: Users can only see/edit their own
CREATE POLICY "Users can view own medical profiles"
  ON public.medical_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical profiles"
  ON public.medical_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical profiles"
  ON public.medical_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Check-ins: Users can only see/edit their own
CREATE POLICY "Users can manage own check-ins"
  ON public.check_ins FOR ALL
  USING (auth.uid() = user_id);

-- Emergency events: Users can only see their own
CREATE POLICY "Users can manage own emergency events"
  ON public.emergency_events FOR ALL
  USING (auth.uid() = user_id);

-- Health entries: Users can only see/edit their own
CREATE POLICY "Users can manage own health entries"
  ON public.health_entries FOR ALL
  USING (auth.uid() = user_id);

-- Reminders: Users can only see/edit their own
CREATE POLICY "Users can manage own reminders"
  ON public.reminders FOR ALL
  USING (auth.uid() = user_id);
```

## 🧭 Navigation Layout

### Navigation Structure

```
Root Layout (_layout.tsx)
├── Auth Stack (if not authenticated)
│   ├── Login
│   ├── Signup
│   └── Onboarding
│
└── Tab Navigator (if authenticated)
    ├── Dashboard (index)
    │   ├── Daily check-in card
    │   ├── Recent health entries
    │   ├── Upcoming reminders
    │   └── Quick emergency access
    │
    ├── Emergency
    │   ├── Panic button (large, accessible)
    │   ├── Location sharing toggle
    │   ├── SMS preview & send
    │   └── Recent emergency events
    │
    ├── History
    │   ├── Crisis timeline
    │   ├── Check-in history
    │   └── Health trends
    │
    └── Profile
        ├── Medical profile
        ├── Emergency contacts
        ├── Reminders management
        └── Settings
```

### Navigation Implementation

- **Expo Router** for file-based routing
- **React Navigation** (via Expo Router) for tab navigation
- **Auth guard** in root layout to redirect unauthenticated users
- **Bottom tabs** for main navigation (Dashboard, Emergency, History, Profile)
- **Stack navigation** for auth flows

## 🎨 Design Principles

1. **Calm & Reassuring**: Soft colors, ample whitespace, gentle animations
2. **Accessibility**: Large touch targets (min 44x44pt), high contrast, VoiceOver support
3. **Fast Emergency Actions**: One-tap panic button, quick SMS send
4. **Clean Architecture**: Separation of concerns, reusable components, typed everything

## 🔐 Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
```


