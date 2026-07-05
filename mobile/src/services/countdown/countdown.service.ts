import { SeverityAssessment } from '@services/severity';
import {
  CountdownCancelCallback,
  CountdownCompleteCallback,
  CountdownConfig,
  CountdownState,
  CountdownUpdateCallback,
  DEFAULT_COUNTDOWN_CONFIG,
} from './types';

class CountdownService {
  private config: CountdownConfig = DEFAULT_COUNTDOWN_CONFIG;
  private state: CountdownState = {
    status: 'idle',
    remainingMs: 0,
    totalMs: 0,
    assessment: null,
    startedAt: null,
    cancelReason: null,
  };
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private updateCallbacks: Set<CountdownUpdateCallback> = new Set();
  private completeCallbacks: Set<CountdownCompleteCallback> = new Set();
  private cancelCallbacks: Set<CountdownCancelCallback> = new Set();

  start(assessment: SeverityAssessment): void {
    if (this.state.status === 'running') {
      if (!this.config.autoRestartOnNewSuspected) return;
      this.clearTick();
    }
    this.state = {
      status: 'running',
      remainingMs: this.config.durationMs,
      totalMs: this.config.durationMs,
      assessment,
      startedAt: Date.now(),
      cancelReason: null,
    };
    this.notifyUpdate();
    this.startTick();
  }

  cancel(reason: string): void {
    if (this.state.status !== 'running') return;
    this.clearTick();
    this.state = { ...this.state, status: 'cancelled', cancelReason: reason };
    this.notifyUpdate();
    this.cancelCallbacks.forEach((cb) => cb(reason));
    setTimeout(() => {
      if (this.state.status === 'cancelled') {
        this.reset();
      }
    }, 2000);
  }

  complete(): void {
    if (this.state.status !== 'running') return;
    this.clearTick();
    const assessment = this.state.assessment;
    this.state = { ...this.state, status: 'dispatched', remainingMs: 0 };
    this.notifyUpdate();
    if (assessment) {
      this.completeCallbacks.forEach((cb) => cb(assessment));
    }
  }

  reset(): void {
    this.clearTick();
    this.state = {
      status: 'idle',
      remainingMs: 0,
      totalMs: 0,
      assessment: null,
      startedAt: null,
      cancelReason: null,
    };
    this.notifyUpdate();
  }

  getState(): CountdownState {
    return { ...this.state };
  }

  updateConfig(config: Partial<CountdownConfig>): void {
    this.config = { ...this.config, ...config };
  }

  onUpdate(callback: CountdownUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    callback(this.state);
    return () => this.updateCallbacks.delete(callback);
  }

  onComplete(callback: CountdownCompleteCallback): () => void {
    this.completeCallbacks.add(callback);
    return () => this.completeCallbacks.delete(callback);
  }

  onCancel(callback: CountdownCancelCallback): () => void {
    this.cancelCallbacks.add(callback);
    return () => this.cancelCallbacks.delete(callback);
  }

  private startTick(): void {
    this.clearTick();
    this.tickInterval = setInterval(() => {
      if (this.state.status !== 'running') return;
      const elapsed = this.state.startedAt ? Date.now() - this.state.startedAt : 0;
      const remaining = Math.max(0, this.config.durationMs - elapsed);
      this.state = { ...this.state, remainingMs: remaining };
      this.notifyUpdate();
      if (remaining <= 0) {
        this.complete();
      }
    }, this.config.tickIntervalMs);
  }

  private clearTick(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private notifyUpdate(): void {
    const snapshot = this.getState();
    this.updateCallbacks.forEach((cb) => cb(snapshot));
  }
}

export const countdownService = new CountdownService();
export { DEFAULT_COUNTDOWN_CONFIG } from './types';
export type {
  CountdownState,
  CountdownStatus,
  CountdownConfig,
  CountdownUpdateCallback,
  CountdownCompleteCallback,
  CountdownCancelCallback,
} from './types';