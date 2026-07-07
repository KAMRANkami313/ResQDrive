import { SeverityAssessment } from '@services/severity';
import { SensorReading } from '@services/iot/types';
import { AlertChannelResult } from '@services/alert';

export type EscalationStatus =
  | 'idle'
  | 'running'
  | 'acknowledged'
  | 'exhausted'
  | 'cancelled'
  | 'error';

export interface ContactNotificationRecord {
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  priority: number;
  notifiedAt: number;
  channels: AlertChannelResult[];
  acknowledged: boolean;
}

export interface EscalationState {
  status: EscalationStatus;
  incidentId: string | null;
  startedAt: number | null;
  endedAt: number | null;
  currentPriority: number;
  contacts: ContactNotificationRecord[];
  acknowledgedBy: ContactNotificationRecord | null;
  acknowledgedAt: number | null;
  cancelReason: string | null;
  nextEscalationAt: number | null;
  errorMessage: string | null;
}

export interface EscalationConfig {
  escalationDelayMs: number;
  autoDialPrimary: boolean;
  enablePushToContacts: boolean;
}

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  escalationDelayMs: 30000,
  autoDialPrimary: true,
  enablePushToContacts: false,
};

export interface EscalationStartInput {
  incidentId: string;
  severity: SeverityAssessment;
  sensorSnapshot: SensorReading | null;
  userName: string;
  userPhone: string;
  mapsLink: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type EscalationUpdateCallback = (state: EscalationState) => void;
export type EscalationAckCallback = (contact: ContactNotificationRecord) => void;
export type EscalationCompleteCallback = (state: EscalationState) => void;