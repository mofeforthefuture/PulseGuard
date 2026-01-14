export interface LocationCircle {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  icon?: string; // emoji or icon name
  color?: string; // hex color
  is_active: boolean;
  contact_ids?: string[]; // IDs of emergency contacts to notify
  created_at: string;
  updated_at: string;
}

export interface LocationCircleContact {
  id: string;
  location_circle_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  avatar_url?: string;
  created_at: string;
}

export interface LocationCircleWithContacts extends LocationCircle {
  contacts: LocationCircleContact[];
}
