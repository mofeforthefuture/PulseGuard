export type ConditionType =
  | 'asthma'
  | 'sickle_cell_disease'
  | 'epilepsy'
  | 'diabetes'
  | 'heart_condition'
  | 'allergies'
  | 'other';

export type MoodType = 'great' | 'good' | 'okay' | 'poor' | 'crisis';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  time?: string;
}

export interface MedicalProfile {
  id: string;
  user_id: string;
  condition_type: ConditionType;
  condition_name?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  diagnosis_date?: string;
  medications?: Medication[];
  triggers?: string[];
  emergency_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  date: string;
  mood?: MoodType;
  symptoms?: Symptom[];
  medication_taken: boolean;
  notes?: string;
  created_at: string;
}

export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface HealthEntry {
  id: string;
  user_id: string;
  entry_type: 'symptom' | 'medication' | 'vital' | 'note';
  data: Record<string, any>;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  reminder_type: 'medication' | 'check_in' | 'appointment';
  time: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



