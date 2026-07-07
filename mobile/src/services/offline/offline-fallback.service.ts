import { networkDetector } from './network-detector';
import { offlineQueue } from './offline-queue';
import { nativeSmsSender } from './native-sms-sender';
import { EmailChannel } from '@services/alert/channels/email-channel';
import { QueuedAlert, QueueChangeCallback } from './types';

class OfflineFallbackService {
  private initialized = false;
  private flushInProgress = false;
  private queueCallbacks: Set<QueueChangeCallback> = new Set();
  private networkUnsub: (() => void) | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;
    await offlineQueue.init();
    networkDetector.init();

    this.networkUnsub = networkDetector.onChange((state) => {
      console.log('[offline-fallback] network changed:', state.isOnline ? 'ONLINE' : 'OFFLINE');
      if (state.isOnline) {
        this.flushQueue();
      }
    });

    this.initialized = true;
    console.log('[offline-fallback] initialized');
  }

  setManualNetworkOverride(online: boolean | null): void {
    networkDetector.setManualOverride(online);
  }

  isOnline(): boolean {
    return networkDetector.isOnline();
  }

  async queueEmail(payload: any): Promise<string | null> {
    const id = await offlineQueue.enqueue({
      type: 'email',
      incidentId: payload.incidentId,
      recipientName: payload.recipientName,
      recipientEmail: payload.recipientEmail,
      payload: JSON.stringify(payload),
      maxAttempts: 3,
    });
    this.notifyQueueChange();
    return id;
  }

  async queueSms(payload: any): Promise<string | null> {
    const id = await offlineQueue.enqueue({
      type: 'sms',
      incidentId: payload.incidentId,
      recipientName: payload.recipientName,
      recipientPhone: payload.recipientPhone,
      payload: JSON.stringify(payload),
      maxAttempts: 3,
    });
    this.notifyQueueChange();
    return id;
  }

  async sendNativeSms(payload: any): Promise<{ success: boolean; error: string | null }> {
    if (!payload.recipientPhone) {
      return { success: false, error: 'No recipient phone' };
    }
    const message = nativeSmsSender.buildMessage({
      id: 'temp',
      type: 'sms',
      incidentId: payload.incidentId,
      recipientName: payload.recipientName,
      recipientPhone: payload.recipientPhone,
      recipientEmail: '',
      payload: JSON.stringify(payload),
      status: 'pending',
      attempts: 0,
      maxAttempts: 1,
      createdAt: Date.now(),
      lastAttemptAt: null,
      error: null,
    });
    return await nativeSmsSender.send(payload.recipientPhone, message);
  }

  async flushQueue(): Promise<{ sent: number; failed: number; skipped: number }> {
    if (this.flushInProgress) {
      return { sent: 0, failed: 0, skipped: 0 };
    }
    if (!networkDetector.isOnline()) {
      console.log('[offline-fallback] offline, skipping flush');
      return { sent: 0, failed: 0, skipped: 0 };
    }

    this.flushInProgress = true;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const pending = await offlineQueue.getPending();
      console.log(`[offline-fallback] flushing ${pending.length} queued alerts`);

      for (const alert of pending) {
        if (alert.attempts >= alert.maxAttempts) {
          skipped++;
          continue;
        }

        try {
          await offlineQueue.updateStatus(alert.id, 'sending', null);
          this.notifyQueueChange();

          let result: { success: boolean; error: string | null } = { success: false, error: 'Unknown alert type' };

          if (alert.type === 'email') {
            const payload = JSON.parse(alert.payload);
            result = await this.trySendEmail(payload);
          } else if (alert.type === 'sms') {
            const payload = JSON.parse(alert.payload);
            result = await this.trySendSmsInternet(payload);
          }

          if (result.success) {
            await offlineQueue.markSent(alert.id);
            sent++;
            console.log(`[offline-fallback] sent: ${alert.id}`);
          } else {
            await offlineQueue.updateStatus(alert.id, 'failed', result.error);
            failed++;
            console.warn(`[offline-fallback] failed: ${alert.id} - ${result.error}`);
          }
        } catch (err) {
          await offlineQueue.updateStatus(alert.id, 'failed', err instanceof Error ? err.message : String(err));
          failed++;
        }

        this.notifyQueueChange();
      }

      await offlineQueue.clearSent();
      this.notifyQueueChange();
      console.log(`[offline-fallback] flush complete: ${sent} sent, ${failed} failed, ${skipped} skipped`);
      return { sent, failed, skipped };
    } finally {
      this.flushInProgress = false;
    }
  }

  private async trySendEmail(payload: any): Promise<{ success: boolean; error: string | null }> {
    try {
      const channel = new EmailChannel();
      const result = await channel.send({
        incidentId: payload.incidentId,
        userId: payload.userId || '',
        userName: payload.userName || '',
        userPhone: payload.userPhone || '',
        severity: payload.severity,
        severityScore: payload.severityScore || 0,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        mapsLink: payload.mapsLink ?? null,
        occurredAt: payload.occurredAt || Date.now(),
        sensorSnapshot: payload.sensorSnapshot ?? null,
        recipientName: payload.recipientName,
        recipientEmail: payload.recipientEmail,
        ackLink: payload.ackLink,
      });
      return {
        success: result.status === 'delivered' || result.status === 'sent',
        error: result.error,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private async trySendSmsInternet(payload: any): Promise<{ success: boolean; error: string | null }> {
    try {
      const { SmsChannel } = await import('@services/alert/channels/sms-channel');
      const channel = new SmsChannel();
      const result = await channel.send({
        incidentId: payload.incidentId,
        userId: payload.userId || '',
        userName: payload.userName || '',
        userPhone: payload.userPhone || '',
        severity: payload.severity,
        severityScore: payload.severityScore || 0,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        mapsLink: payload.mapsLink ?? null,
        occurredAt: payload.occurredAt || Date.now(),
        sensorSnapshot: payload.sensorSnapshot ?? null,
        recipientName: payload.recipientName,
        recipientPhone: payload.recipientPhone,
        ackLink: payload.ackLink,
      });
      return {
        success: result.status === 'delivered' || result.status === 'sent',
        error: result.error,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  onQueueChange(callback: QueueChangeCallback): () => void {
    this.queueCallbacks.add(callback);
    return () => this.queueCallbacks.delete(callback);
  }

  private notifyQueueChange(): void {
    offlineQueue.getPending().then((queue) => {
      this.queueCallbacks.forEach((cb) => cb(queue));
    });
  }

  async getQueue(): Promise<QueuedAlert[]> {
    return await offlineQueue.getPending();
  }

  async clearQueue(): Promise<void> {
    await offlineQueue.clearAll();
    this.notifyQueueChange();
  }

  cleanup(): void {
    if (this.networkUnsub) {
      this.networkUnsub();
      this.networkUnsub = null;
    }
    networkDetector.cleanup();
  }
}

export const offlineFallbackService = new OfflineFallbackService();