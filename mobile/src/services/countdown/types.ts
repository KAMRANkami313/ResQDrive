import { SeverityAssessment } from '@services/severity';

export type CountdownStatus = 'idle' | 'running' | 'cancelled' | 'dispatched' | 'expired';

export interface CountdownState {
  status: CountdownStatus;
  remainingMs: number;
  totalMs: number;
  assessment: SeverityAssessment | null;
  startedAt: number | null;
  cancelReason: string | null;
}

export type CountdownUpdateCallback = (state: CountdownState) => void;
export type CountdownCompleteCallback = (assessment: SeverityAssessment) => void;
export type CountdownCancelCallback = (reason: string) => void;

export interface CountdownConfig {
  durationMs: number;
  tickIntervalMs: number;
  autoRestartOnNewSuspected: boolean;
}

export const DEFAULT_COUNTDOWN_CONFIG: CountdownConfig = {
  durationMs: 10000,
  tickIntervalMs: 100,
  autoRestartOnNewSuspected: true,
};