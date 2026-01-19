# PulseGuard

A React Native medical companion app built with Expo, TypeScript, and Supabase. PulseGuard helps people with chronic or emergency-prone conditions (Asthma, SCD, Epilepsy, etc.) manage their health with calm, reassuring UI and fast emergency actions.

## 🎯 Features

- **Authentication & Onboarding**: Secure auth with Supabase, personalized onboarding flow
- **Medical Profile**: Track conditions, medications, triggers, and emergency instructions
- **Daily Check-ins**: Mood tracking, symptom logging, medication reminders
- **Emergency Screen**: One-tap panic button, location sharing, AI-generated SMS
- **Health Tracking**: Crisis history, check-in timeline, health trends
- **Reminders & Notifications**: Medication reminders, check-in prompts
- **AI Assistant (ALARA)**: Advanced Life-Aid Response Assistant for danger pattern detection

## 🛠 Tech Stack

- **Framework**: Expo + React Native
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (Auth, Postgres, RLS)
- **AI**: OpenRouter for ALARA integration
- **State Management**: React Context API

## 📁 Project Structure

```
pulseguard/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication flow
│   └── (tabs)/            # Main app tabs
├── src/
│   ├── components/        # Reusable components
│   ├── lib/               # Utilities & services
│   ├── hooks/             # Custom React hooks
│   ├── context/           # React Context providers
│   └── types/             # TypeScript type definitions
├── supabase/              # Database schema
└── assets/                # Images, fonts, etc.
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- OpenRouter API key (for ALARA)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and OpenRouter credentials.

3. **Set up Supabase**:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL Editor
   - Copy your project URL and anon key to `.env`

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on your device**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 🗄️ Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script
5. Verify tables and RLS policies are created

## 🎨 Design Principles

- **Calm & Reassuring**: Soft colors, ample whitespace, gentle animations (inspired by FLO app)
- **Accessibility-First**: Large touch targets (min 44x44pt), high contrast, VoiceOver support
- **Fast Emergency Actions**: One-tap panic button, quick SMS send
- **Clean Architecture**: Separation of concerns, reusable components, fully typed

## 📱 Key Screens

- **Login/Signup**: Authentication flow
- **Onboarding**: Condition selection and emergency contact setup
- **Dashboard**: Daily check-ins, quick actions, recent activity
- **Emergency**: Panic button, location sharing, SMS generation
- **History**: Crisis timeline, check-in history, health trends
- **Profile**: Medical profile, emergency contacts, reminders, settings

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Secure authentication via Supabase Auth
- Environment variables for sensitive keys

## 🧪 Development

### Adding a new screen:
1. Create file in `app/` directory following Expo Router conventions
2. Add navigation in appropriate `_layout.tsx`
3. Create components in `src/components/` if needed

### Adding a new feature:
1. Define types in `src/types/`
2. Create hooks in `src/hooks/` if needed
3. Add services in `src/lib/services/`
4. Update database schema if needed

## 📝 TODO

- [ ] Implement ALARA AI integration
- [ ] Add location services
- [ ] Implement SMS generation and sending
- [ ] Add push notifications
- [ ] Complete check-in flow
- [ ] Add health tracking charts
- [ ] Implement reminder system
- [ ] Add accessibility features (VoiceOver, screen reader)
- [ ] Add unit and integration tests

## 📄 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.



# PulseGuard
