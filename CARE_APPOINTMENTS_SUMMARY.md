# Care & Appointments Module - Quick Summary

## 📁 Folder Structure

```
src/
├── components/
│   └── care/                          ⭐ NEW MODULE
│       ├── index.ts
│       ├── README.md
│       ├── CareDashboardScreen.tsx    # Main dashboard
│       ├── UpcomingAppointmentsCard.tsx
│       ├── AppointmentCard.tsx
│       ├── CareLogCard.tsx
│       ├── ProviderCard.tsx
│       ├── TimelineView.tsx
│       ├── AddAppointmentModal.tsx
│       ├── AddCareLogModal.tsx
│       ├── AddProviderModal.tsx
│       ├── EditAppointmentModal.tsx
│       └── AppointmentDetailsModal.tsx
│
├── lib/
│   └── services/
│       ├── careService.ts             ⭐ NEW
│       └── providerService.ts         ⭐ NEW
│
└── types/
    └── care.ts                        ⭐ NEW

app/
└── (tabs)/
    └── care.tsx                       ⭐ NEW TAB
```

---

## 🧭 Navigation Placement

### Bottom Tab Bar (Updated)

```
┌─────────────────────────────────────┐
│  Home  Emergency  Care  Profile │  ← "Care" replaces "Medications"
└─────────────────────────────────────┘
```

### Tab Configuration

```typescript
// Position: Between "Emergency" and "Profile" (replaces Medications tab)
<Tabs.Screen
  name="care"
  options={{
    title: 'Care',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="medical-outline" size={size || 24} color={color} />
    ),
  }}
/>

// Medications is now hidden and accessible from Care module
<Tabs.Screen
  name="medications"
  options={{
    href: null, // Hide from tab bar - accessible from Care module
  }}
/>
```

---

## 🗄️ Database Tables

### 1. `healthcare_providers`
- Stores doctors, hospitals, clinics
- Fields: name, type, specialty, contact, location
- **Key**: Links to appointments and care logs

### 2. `appointments`
- Scheduled medical appointments
- Fields: title, scheduled_at, status, provider_id
- **Key**: Future events, can link to care_logs when completed

### 3. `care_logs`
- Historical medical events/visits
- Fields: title, occurred_at, diagnosis, treatment, provider_id
- **Key**: Past events, can link to appointments

---

## 🔗 Data Flow

```
User
  ├── healthcare_providers (1:N)
  │     ├── appointments (1:N)
  │     └── care_logs (1:N)
  │
  ├── appointments (1:N)
  │     └── care_logs (1:1, optional)
  │
  └── care_logs (1:N)
```

**Relationship Notes:**
- Appointment → Care Log: When appointment is completed, create a care log entry
- Provider → Appointments: One provider can have many appointments
- Provider → Care Logs: One provider can have many care logs

---

## 📊 Dashboard Features

### Main Dashboard (`care.tsx`)

1. **Upcoming Appointments Card**
   - Next 3-5 appointments
   - Countdown to next appointment
   - Quick "View All" link

2. **Recent Care Logs Card**
   - Last 5-10 medical events
   - Reverse chronological order
   - Quick "View Timeline" link

3. **Healthcare Providers Card**
   - List of all providers
   - Primary provider highlighted
   - Quick contact actions

4. **Quick Actions**
   - Add Appointment
   - Add Care Log
   - Add Provider

---

## 🎯 Key Distinctions

| Feature | Appointments | Care Logs |
|---------|-------------|-----------|
| **Time** | Future (scheduled) | Past (occurred) |
| **Status** | scheduled, confirmed, completed, cancelled | N/A (already happened) |
| **Purpose** | Planning & reminders | Historical record |
| **UI Color** | Primary/Info (blue) | Success/Calm (green) |
| **Link** | Can create care log when completed | Can link back to appointment |

---

## ✅ Implementation Checklist

- [ ] Run `supabase/care_appointments_schema.sql` in Supabase
- [ ] Create `src/types/care.ts` with TypeScript interfaces
- [ ] Create `src/lib/services/careService.ts`
- [ ] Create `src/lib/services/providerService.ts`
- [ ] Create component files in `src/components/care/`
- [ ] Create `app/(tabs)/care.tsx` main screen
- [ ] Update `app/(tabs)/_layout.tsx` to add Care tab
- [ ] Update `src/lib/supabase/types.ts` with new table types
- [ ] Test RLS policies
- [ ] Add to dashboard quick actions (optional)

---

## 🔄 Integration Points

1. **Reminders**: Auto-create reminders for appointments
2. **Medications**: Link prescribed medications to care logs
3. **Emergency**: Emergency visits become care logs
4. **ALARA**: Reference care history in AI context
5. **History**: Care logs appear in overall health timeline

---

## 📝 Next Steps

1. Review proposal document: `CARE_APPOINTMENTS_PROPOSAL.md`
2. Review SQL schema: `supabase/care_appointments_schema.sql`
3. Approve structure and proceed with implementation
4. Start with database setup, then types, then services, then UI
