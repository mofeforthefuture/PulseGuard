export type EmergencyEventType = 'panic_button' | 'detected_pattern' | 'manual';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface AIAnalysis {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  detected_patterns: string[];
  recommendations: string[];
  confidence: number;
}

export interface EmergencyEvent {
  id: string;
  user_id: string;
  event_type: EmergencyEventType;
  location?: Location;
  sms_content?: string;
  sms_sent_to?: string[];
  ai_analysis?: AIAnalysis;
  resolved_at?: string;
  created_at: string;
}



