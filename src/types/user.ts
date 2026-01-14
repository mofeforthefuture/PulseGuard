export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile extends User {}



