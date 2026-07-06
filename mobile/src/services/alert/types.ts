import { SeverityAssessment } from '@services/severity';
import { SensorReading } from '@services/iot/types';

export type AlertChannelType = 'push' | 'sms' | 'email';

export type AlertDeliveryStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'retrying';

export interface AlertChannelResult {
  channel: AlertChannelType;
  status: AlertDeliveryStatus;
  attemptedAt: number;
  deliveredAt: number | null;
  error: string | null;
  retryCount: number;
  messageId: string | null;
}

export interface AlertPayload {
  incidentId: string;
  userId: string;
  userName: string;
  userPhone: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  severity: SeverityAssessment['level'];
  severityScore: number;
  latitude: number | null;
  longitude: number | null;
  mapsLink: string | null;
  occurredAt: number;
  sensorSnapshot: SensorReading | null;
}

export interface AlertDispatchResult {
  incidentId: string;
  dispatchedAt: number;
  channels: AlertChannelResult[];
  overallStatus: 'partial' | 'success' | 'failed';
}

export interface IAlertChannel {
  readonly type: AlertChannelType;
  send(payload: AlertPayload): Promise<AlertChannelResult>;
}

export interface AlertDispatchConfig {
  retryMaxAttempts: number;
  retryDelayMs: number;
  enablePush: boolean;
  enableSms: boolean;
  enableEmail: boolean;
}

export const DEFAULT_ALERT_CONFIG: AlertDispatchConfig = {
  retryMaxAttempts: 3,
  retryDelayMs: 60000,
  enablePush: true,
  enableSms: true,
  enableEmail: true,
};

export type AlertDispatchCallback = (result: AlertDispatchResult) => void;
export type ChannelStatusCallback = (channel: AlertChannelType, result: AlertChannelResult) => void;