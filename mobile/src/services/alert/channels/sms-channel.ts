import { env } from '@config/env';
import { AlertChannelResult, AlertPayload, IAlertChannel } from '../types';

export class SmsChannel implements IAlertChannel {
  readonly type = 'sms' as const;

  async send(payload: AlertPayload): Promise<AlertChannelResult> {
    const attemptedAt = Date.now();
    try {
      const isMock = !env.twilioSid || !env.twilioToken;
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return {
          channel: 'sms',
          status: 'delivered',
          attemptedAt,
          deliveredAt: Date.now(),
          error: null,
          retryCount: 0,
          messageId: `mock-sms-${payload.incidentId}-${Date.now()}`,
        };
      }

      const message = `ResQDrive ALERT: ${payload.userName} may have been in a ${payload.severity} accident. ${payload.mapsLink || 'Location unavailable'}`;
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${env.twilioSid}:${env.twilioToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: env.twilioFrom,
          To: payload.userPhone,
          Body: message,
        }).toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          channel: 'sms',
          status: 'failed',
          attemptedAt,
          deliveredAt: null,
          error: `Twilio HTTP ${res.status}: ${errText}`,
          retryCount: 0,
          messageId: null,
        };
      }

      const data = await res.json();
      return {
        channel: 'sms',
        status: data.status === 'queued' || data.status === 'sent' ? 'delivered' : 'sent',
        attemptedAt,
        deliveredAt: Date.now(),
        error: null,
        retryCount: 0,
        messageId: data.sid,
      };
    } catch (err) {
      return {
        channel: 'sms',
        status: 'failed',
        attemptedAt,
        deliveredAt: null,
        error: err instanceof Error ? err.message : String(err),
        retryCount: 0,
        messageId: null,
      };
    }
  }
}