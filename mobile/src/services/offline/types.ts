export type QueuedAlertType = 'email' | 'sms' | 'push';

export type QueuedAlertStatus = 'pending' | 'sending' | 'sent' | 'failed';

export interface QueuedAlert {
  id: string;
  type: QueuedAlertType;
  incidentId: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  payload: string;
  status: QueuedAlertStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  lastAttemptAt: number | null;
  error: string | null;
}

export interface NetworkState {
  isOnline: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'unknown' | 'none';
  isConnected: boolean;
  isInternetReachable: boolean | null;
  details: any;
}

export type NetworkChangeCallback = (state: NetworkState) => void;
export type QueueChangeCallback = (queue: QueuedAlert[]) => void;