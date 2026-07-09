export interface EmergencyNumber {
  id: string;
  region: string;
  serviceName: string;
  phone: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export type PakistaniRegion =
  | 'punjab'
  | 'islamabad'
  | 'kpk'
  | 'sindh'
  | 'karachi'
  | 'balochistan'
  | 'gilgit'
  | 'ajk'
  | 'default';

export interface SosState {
  isActive: boolean;
  region: PakistaniRegion;
  regionLabel: string;
  emergencyNumbers: EmergencyNumber[];
  customNumbers: EmergencyNumber[];
  autoDialTriggered: boolean;
  autoDialCountdown: number | null;
  incidentId: string | null;
  errorMessage: string | null;
}

export interface SosConfig {
  autoDialDelayMs: number;
  autoDialEnabled: boolean;
}

export const DEFAULT_SOS_CONFIG: SosConfig = {
  autoDialDelayMs: 60000,
  autoDialEnabled: true,
};

export type SosUpdateCallback = (state: SosState) => void;