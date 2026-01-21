/**
 * Care & Appointments Types
 */

export type ProviderType = 'doctor' | 'hospital' | 'clinic' | 'specialist' | 'therapist' | 'other';

export type AppointmentType = 'checkup' | 'followup' | 'consultation' | 'procedure' | 'surgery' | 'therapy' | 'emergency' | 'other';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';

export type LocationType = 'in_person' | 'virtual' | 'phone' | 'hospital' | 'clinic' | 'emergency_room';

export type CareLogType = 'visit' | 'procedure' | 'test' | 'diagnosis' | 'treatment' | 'hospital_stay' | 'emergency_visit' | 'therapy_session' | 'other';

export interface HealthcareProvider {
  id: string;
  user_id: string;
  provider_type: ProviderType;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  location?: { lat: number; lng: number };
  notes?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  provider_id?: string;
  title: string;
  appointment_type?: AppointmentType;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  status: AppointmentStatus;
  location_type?: LocationType;
  location_address?: string;
  reason?: string;
  preparation_notes?: string;
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CareLog {
  id: string;
  user_id: string;
  provider_id?: string;
  appointment_id?: string;
  log_type: CareLogType;
  title: string;
  occurred_at: string;
  duration_minutes?: number;
  diagnosis?: string;
  treatment?: string;
  medications_prescribed?: any[];
  test_results?: any;
  symptoms_reported?: any[];
  location_type?: LocationType;
  location_name?: string;
  notes?: string;
  follow_up_required: boolean;
  follow_up_notes?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
}

// Blood Pressure Types
export type BloodPressurePosition = 'sitting' | 'standing' | 'lying' | 'other';

export type AbnormalReason = 'high_systolic' | 'low_systolic' | 'high_diastolic' | 'low_diastolic' | 'both_high' | 'both_low' | null;

export interface BloodPressureReading {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  recorded_at: string;
  notes?: string;
  position?: BloodPressurePosition;
  is_abnormal: boolean;
  abnormal_reason?: AbnormalReason;
  created_at: string;
  updated_at: string;
}

export interface BloodPressureInput {
  systolic: number;
  diastolic: number;
  pulse?: number;
  notes?: string;
  position?: BloodPressurePosition;
}

// Blood Pressure Categories (for reference)
export const BP_CATEGORIES = {
  normal: { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
  elevated: { systolic: { min: 120, max: 129 }, diastolic: { min: 60, max: 80 } },
  high_stage1: { systolic: { min: 130, max: 139 }, diastolic: { min: 80, max: 89 } },
  high_stage2: { systolic: { min: 140, max: 180 }, diastolic: { min: 90, max: 120 } },
  crisis: { systolic: { min: 180 }, diastolic: { min: 120 } },
} as const;

// Medical Checkup Types
export interface MedicalCheckup {
  id: string;
  user_id: string;
  interval_months: number;
  last_checkup_date?: string;
  next_checkup_date?: string;
  reminder_1_week_sent: boolean;
  reminder_due_date_sent: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalCheckupInput {
  interval_months: number;
  last_checkup_date?: string;
  notes?: string;
}

// Doctor Visit Reminder Types
export interface DoctorVisitReminder {
  id: string;
  user_id: string;
  doctor_name: string;
  recommendation_text: string;
  reminder_date: string;
  visit_date?: string;
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorVisitReminderInput {
  doctor_name: string;
  recommendation_text: string;
  visit_date?: string;
  notes?: string;
}

// Hospital Types
export interface Hospital {
  id: string;
  user_id: string;
  hospital_name: string;
  phone_number: string;
  patient_card_id?: string;
  is_primary: boolean;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HospitalInput {
  hospital_name: string;
  phone_number: string;
  patient_card_id?: string;
  is_primary?: boolean;
  address?: string;
  notes?: string;
}

// Clinical Date Types
export type ClinicalType = 'lab_test' | 'scan' | 'procedure' | 'follow_up' | 'screening' | 'other';

export interface ClinicalDate {
  id: string;
  user_id: string;
  clinical_date: string;
  description: string;
  clinical_type?: ClinicalType;
  location?: string;
  provider_name?: string;
  preparation_notes?: string;
  notes?: string;
  is_completed: boolean;
  completed_at?: string;
  reminder_enabled: boolean;
  reminder_1_day_sent: boolean;
  reminder_1_week_sent: boolean;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalDateInput {
  clinical_date: string;
  description: string;
  clinical_type?: ClinicalType;
  location?: string;
  provider_name?: string;
  preparation_notes?: string;
  notes?: string;
  reminder_enabled?: boolean;
}
