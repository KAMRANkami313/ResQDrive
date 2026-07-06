import { env } from '@config/env';
import { AlertChannelResult, AlertPayload, IAlertChannel } from '../types';

export class EmailChannel implements IAlertChannel {
  readonly type = 'email' as const;

  async send(payload: AlertPayload): Promise<AlertChannelResult> {
    const attemptedAt = Date.now();
    try {
      const isMock = !env.brevoApiKey;
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return {
          channel: 'email',
          status: 'delivered',
          attemptedAt,
          deliveredAt: Date.now(),
          error: null,
          retryCount: 0,
          messageId: `mock-email-${payload.incidentId}-${Date.now()}`,
        };
      }

      const subject = `ResQDrive Alert: ${payload.severity.toUpperCase()} accident - ${payload.userName}`;
      const html = `
        <h2>Emergency Alert</h2>
        <p><strong>${payload.userName}</strong> may have been in a <strong>${payload.severity}</strong> accident.</p>
        <p><strong>Time:</strong> ${new Date(payload.occurredAt).toLocaleString()}</p>
        <p><strong>Location:</strong> <a href="${payload.mapsLink}">View on Google Maps</a></p>
        <p><strong>Vehicle:</strong> ${payload.vehicleMake || ''} ${payload.vehicleModel || ''} (${payload.vehiclePlate || 'N/A'})</p>
        <p><strong>Severity Score:</strong> ${(payload.severityScore * 100).toFixed(1)}%</p>
        <hr>
        <p style="font-size:12px;color:#666;">This is an automated alert from ResQDrive. If this is a false alarm, please contact ${payload.userName} directly.</p>
      `;

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'ResQDrive', email: 'alerts@resqdrive.app' },
          to: [{ email: 'emergency-contact@example.com' }],
          subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          channel: 'email',
          status: 'failed',
          attemptedAt,
          deliveredAt: null,
          error: `Brevo HTTP ${res.status}: ${errText}`,
          retryCount: 0,
          messageId: null,
        };
      }

      const data = await res.json();
      return {
        channel: 'email',
        status: 'delivered',
        attemptedAt,
        deliveredAt: Date.now(),
        error: null,
        retryCount: 0,
        messageId: data.messageId || `brevo-${Date.now()}`,
      };
    } catch (err) {
      return {
        channel: 'email',
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