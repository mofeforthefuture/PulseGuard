// Database types generated from Supabase schema
// These will be auto-generated later, but for now we define them manually

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ConditionType =
  | 'asthma'
  | 'sickle_cell_disease'
  | 'epilepsy'
  | 'diabetes'
  | 'heart_condition'
  | 'allergies'
  | 'other';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone_number: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      medical_profiles: {
        Row: {
          id: string;
          user_id: string;
          condition_type: ConditionType;
          condition_name: string | null;
          severity: string | null;
          diagnosis_date: string | null;
          medications: Json | null;
          triggers: Json | null;
          emergency_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          condition_type: ConditionType;
          condition_name?: string | null;
          severity?: string | null;
          diagnosis_date?: string | null;
          medications?: Json | null;
          triggers?: Json | null;
          emergency_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          condition_type?: ConditionType;
          condition_name?: string | null;
          severity?: string | null;
          diagnosis_date?: string | null;
          medications?: Json | null;
          triggers?: Json | null;
          emergency_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mood: string | null;
          symptoms: Json | null;
          medication_taken: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          mood?: string | null;
          symptoms?: Json | null;
          medication_taken?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mood?: string | null;
          symptoms?: Json | null;
          medication_taken?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
      emergency_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          location: Json | null;
          sms_content: string | null;
          sms_sent_to: string[] | null;
          ai_analysis: Json | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          location?: Json | null;
          sms_content?: string | null;
          sms_sent_to?: string[] | null;
          ai_analysis?: Json | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          location?: Json | null;
          sms_content?: string | null;
          sms_sent_to?: string[] | null;
          ai_analysis?: Json | null;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      health_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_type: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_type: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_type?: string;
          data?: Json | null;
          created_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          reminder_type: string;
          time: string;
          days_of_week: number[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          reminder_type: string;
          time: string;
          days_of_week: number[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          description?: string | null;
          reminder_type?: string;
          time?: string;
          days_of_week?: number[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}



