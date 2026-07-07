import { SeverityAssessment } from '@services/severity';
import { SensorReading } from '@services/iot/types';
import { useAuthStore } from '@stores/auth.store';
import { vehicleService } from '@services/vehicle.service';
import { offlineFallbackService, networkDetector } from '@services/offline';
import { incidentService } from './incident.service';
import { PushChannel } from './channels/push-channel';
import { SmsChannel } from './channels/sms-channel';
import { EmailChannel } from './channels/email-channel';
import {
  AlertChannelResult,
  AlertChannelType,
  AlertDispatchCallback,
  AlertDispatchConfig,
  AlertDispatchResult,
  AlertPayload,
  ChannelStatusCallback,
  DEFAULT_ALERT_CONFIG,
  IAlertChannel,
} from './types';

class AlertDispatchService {
  private config: AlertDispatchConfig = DEFAULT_ALERT_CONFIG;
  private channels: Map<AlertChannelType, IAlertChannel> = new Map();
  private dispatchCallbacks: Set<AlertDispatchCallback> = new Set();
  private channelCallbacks: Set<ChannelStatusCallback> = new Set();
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor() {
    this.channels.set('push', new PushChannel());
    this.channels.set('sms', new SmsChannel());
    this.channels.set('email', new EmailChannel());
  }

  updateConfig(config: Partial<AlertDispatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  onDispatch(callback: AlertDispatchCallback): () => void {
    this.dispatchCallbacks.add(callback);
    return () => this.dispatchCallbacks.delete(callback);
  }

  onChannelStatus(callback: ChannelStatusCallback): () => void {
    this.channelCallbacks.add(callback);
    return () => this.channelCallbacks.delete(callback);
  }

  async dispatch(payload: Omit<AlertPayload, 'incidentId'> & { incidentId?: string }): Promise<AlertDispatchResult> {
    let incidentId = payload.incidentId;

    if (!incidentId) {
      const incident = await incidentService.create({
        vehicleId: null,
        severity: payload.severity,
        severityScore: payload.severityScore,
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: '',
        sensorSnapshot: payload.sensorSnapshot,
      });
      incidentId = incident?.id || `temp-${Date.now()}`;
    }

    const fullPayload: AlertPayload = { ...payload, incidentId };

    const activeChannels: IAlertChannel[] = [];
    if (this.config.enablePush) activeChannels.push(this.channels.get('push')!);
    if (this.config.enableSms) activeChannels.push(this.channels.get('sms')!);
    if (this.config.enableEmail) activeChannels.push(this.channels.get('email')!);

    const initialResults: AlertChannelResult[] = activeChannels.map((ch) => ({
      channel: ch.type,
      status: 'pending' as const,
      attemptedAt: 0,
      deliveredAt: null,
      error: null,
      retryCount: 0,
      messageId: null,
    }));

    const sendPromises = activeChannels.map(async (channel, idx) => {
      initialResults[idx] = {
        ...initialResults[idx],
        status: 'sending',
        attemptedAt: Date.now(),
      };
      this.notifyChannel(channel.type, initialResults[idx]);

      const isOnline = networkDetector.isOnline();
      console.log(`[alert-dispatch] channel ${channel.type}, online: ${isOnline}`);

      let result;

      if (isOnline) {
        result = await channel.send(fullPayload);
      } else {
        if (channel.type === 'sms') {
          console.log('[alert-dispatch] offline — sending SMS via native cellular modem');
          const nativeResult = await offlineFallbackService.sendNativeSms(fullPayload);
          result = {
            channel: 'sms' as const,
            status: nativeResult.success ? 'delivered' as const : 'failed' as const,
            attemptedAt: Date.now(),
            deliveredAt: nativeResult.success ? Date.now() : null,
            error: nativeResult.error,
            retryCount: 0,
            messageId: nativeResult.success ? `native-sms-${Date.now()}` : null,
          };
        } else if (channel.type === 'email') {
          console.log('[alert-dispatch] offline — queuing email for later');
          const queueId = await offlineFallbackService.queueEmail(fullPayload);
          result = {
            channel: 'email' as const,
            status: 'pending' as const,
            attemptedAt: Date.now(),
            deliveredAt: null,
            error: null,
            retryCount: 0,
            messageId: queueId,
          };
        } else {
          result = await channel.send(fullPayload);
        }
      }

      initialResults[idx] = result;
      this.notifyChannel(channel.type, result);

      if (result.status === 'failed' && result.retryCount < this.config.retryMaxAttempts) {
        this.scheduleRetry(channel, fullPayload, result);
      }

      return result;
    });

    await Promise.all(sendPromises);

    const allDelivered = initialResults.every((r) => r.status === 'delivered' || r.status === 'sent');
    const anyDelivered = initialResults.some((r) => r.status === 'delivered' || r.status === 'sent');

    const overallStatus: AlertDispatchResult['overallStatus'] = allDelivered
      ? 'success'
      : anyDelivered
      ? 'partial'
      : 'failed';

    const dispatchResult: AlertDispatchResult = {
      incidentId,
      dispatchedAt: Date.now(),
      channels: initialResults,
      overallStatus,
    };

    await incidentService.updateDispatchStatus(incidentId, {
      dispatchedAt: dispatchResult.dispatchedAt,
      overallStatus,
      channels: initialResults,
    });

    this.dispatchCallbacks.forEach((cb) => cb(dispatchResult));
    return dispatchResult;
  }

  private scheduleRetry(channel: IAlertChannel, payload: AlertPayload, lastResult: AlertChannelResult): void {
    const retryCount = lastResult.retryCount + 1;
    if (retryCount > this.config.retryMaxAttempts) return;

    const key = `${payload.incidentId}-${channel.type}`;
    const existing = this.retryTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.retryTimers.delete(key);
      const retryResult: AlertChannelResult = {
        ...lastResult,
        status: 'retrying',
        retryCount,
        attemptedAt: Date.now(),
      };
      this.notifyChannel(channel.type, retryResult);

      const result = await channel.send(payload);
      result.retryCount = retryCount;
      this.notifyChannel(channel.type, result);

      if (result.status === 'failed' && retryCount < this.config.retryMaxAttempts) {
        this.scheduleRetry(channel, payload, result);
      }
    }, this.config.retryDelayMs);

    this.retryTimers.set(key, timer);
  }

  private notifyChannel(channel: AlertChannelType, result: AlertChannelResult): void {
    this.channelCallbacks.forEach((cb) => cb(channel, result));
  }

  cancelRetries(incidentId: string): void {
    for (const [key, timer] of this.retryTimers.entries()) {
      if (key.startsWith(incidentId)) {
        clearTimeout(timer);
        this.retryTimers.delete(key);
      }
    }
  }
}

async function buildAlertPayload(
  severity: SeverityAssessment,
  sensorSnapshot: SensorReading | null,
): Promise<Omit<AlertPayload, 'incidentId'>> {
  const user = useAuthStore.getState().user;

  let primaryVehicle = null;
  try {
    const { vehicles } = await vehicleService.list();
    primaryVehicle = vehicles.find((v) => v.is_primary) || vehicles[0];
  } catch (err) {
    console.warn('[alert] failed to load vehicles for payload:', err);
  }

  const latitude = sensorSnapshot?.gps?.lat ?? null;
  const longitude = sensorSnapshot?.gps?.lng ?? null;
  const mapsLink = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  return {
    userId: user?.id || 'unknown',
    userName: user?.full_name || 'ResQDrive User',
    userPhone: user?.phone || '',
    vehicleMake: primaryVehicle?.make,
    vehicleModel: primaryVehicle?.model,
    vehiclePlate: primaryVehicle?.license_plate,
    severity: severity.level,
    severityScore: severity.score,
    latitude,
    longitude,
    mapsLink,
    occurredAt: Date.now(),
    sensorSnapshot,
  };
}

export const alertDispatchService = new AlertDispatchService();
export { buildAlertPayload };
export { DEFAULT_ALERT_CONFIG } from './types';
export type {
  AlertPayload,
  AlertDispatchResult,
  AlertChannelResult,
  AlertChannelType,
  AlertDeliveryStatus,
  IAlertChannel,
  AlertDispatchConfig,
} from './types';