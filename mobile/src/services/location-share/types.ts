export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  speedKmh: number;
  heading: number;
  timestamp: number;
}

export interface LocationShareState {
  shareId: string | null;
  incidentId: string | null;
  shareToken: string | null;
  shareUrl: string | null;
  isActive: boolean;
  startedAt: number | null;
  lastUpdateAt: number | null;
  updateCount: number;
  currentLocation: LocationUpdate | null;
  errorMessage: string | null;
  phase: 'fast' | 'slow' | 'ended';
}

export interface LocationShareConfig {
  fastUpdateIntervalMs: number;
  slowUpdateIntervalMs: number;
  fastPhaseDurationMs: number;
  maxDurationMs: number;
  inactivityTimeoutMs: number;
}

export const DEFAULT_LOCATION_SHARE_CONFIG: LocationShareConfig = {
  fastUpdateIntervalMs: 5000,
  slowUpdateIntervalMs: 30000,
  fastPhaseDurationMs: 600000,
  maxDurationMs: 7200000,
  inactivityTimeoutMs: 7200000,
};

export type LocationShareUpdateCallback = (state: LocationShareState) => void;