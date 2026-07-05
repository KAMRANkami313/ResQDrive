export type UserRole = 'driver' | 'admin' | 'emergency_staff' | 'mechanic';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  cnic: string;
  blood_group: string;
  allergies: string;
  avatar_url: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  vin: string;
  insurance_provider: string;
  insurance_policy_number: string;
  insurance_expiry: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SeverityLevel = 'minor' | 'moderate' | 'severe';

export type IncidentStatus =
  | 'suspected'
  | 'confirmed'
  | 'cancelled'
  | 'dispatched'
  | 'acknowledged'
  | 'resolved';

export interface Incident {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  occurred_at: string;
  latitude: number;
  longitude: number;
  address: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  sensor_snapshot: Record<string, any>;
  alert_dispatch_status: Record<string, any>;
  damage_assessment: Record<string, any> | null;
  repair_cost_estimate: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AppError {
  code: string;
  message: string;
  field?: string;
}