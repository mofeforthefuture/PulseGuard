export interface MedicationDose {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string; // HH:MM format
  takenAt?: string; // ISO timestamp when taken
  status: 'pending' | 'taken' | 'missed' | 'upcoming';
  icon?: string;
}

export interface MedicationWithDoses {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time?: string;
  icon?: string;
  doses: MedicationDose[];
}
