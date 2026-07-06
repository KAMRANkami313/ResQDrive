import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AlertChannelResult, AlertPayload, IAlertChannel } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

export class PushChannel implements IAlertChannel {
  readonly type = 'push' as const;

  async send(payload: AlertPayload): Promise<AlertChannelResult> {
    const attemptedAt = Date.now();
    try {
      if (Platform.OS === 'web') {
        return await this.sendWeb(payload, attemptedAt);
      }
      return await this.sendNative(payload, attemptedAt);
    } catch (err) {
      console.error('[push-channel] error:', err);
      return {
        channel: 'push',
        status: 'failed',
        attemptedAt,
        deliveredAt: null,
        error: err instanceof Error ? err.message : String(err),
        retryCount: 0,
        messageId: null,
      };
    }
  }

  private async sendWeb(payload: AlertPayload, attemptedAt: number): Promise<AlertChannelResult> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        channel: 'push',
        status: 'failed',
        attemptedAt,
        deliveredAt: null,
        error: 'Notifications API not supported in this browser',
        retryCount: 0,
        messageId: null,
      };
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return {
        channel: 'push',
        status: 'failed',
        attemptedAt,
        deliveredAt: null,
        error: `Push permission not granted (current: ${permission})`,
        retryCount: 0,
        messageId: null,
      };
    }

    const title = `EMERGENCY: ${payload.severity.toUpperCase()} accident`;
    const body = `${payload.userName} may have been in an accident. Location: ${payload.mapsLink || 'Unknown'}`;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: `incident-${payload.incidentId}`,
      requireInteraction: true,
      data: {
        incidentId: payload.incidentId,
        type: 'emergency_alert',
        severity: payload.severity,
        mapsLink: payload.mapsLink,
      },
    });

    notification.onclick = () => {
      if (payload.mapsLink) {
        window.open(payload.mapsLink, '_blank');
      }
      notification.close();
    };

    return {
      channel: 'push',
      status: 'delivered',
      attemptedAt,
      deliveredAt: Date.now(),
      error: null,
      retryCount: 0,
      messageId: `web-${payload.incidentId}-${Date.now()}`,
    };
  }

  private async sendNative(payload: AlertPayload, attemptedAt: number): Promise<AlertChannelResult> {
    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }

    if (!granted) {
      return {
        channel: 'push',
        status: 'failed',
        attemptedAt,
        deliveredAt: null,
        error: 'Push permission not granted',
        retryCount: 0,
        messageId: null,
      };
    }

    const title = `EMERGENCY: ${payload.severity.toUpperCase()} accident`;
    const body = `${payload.userName} may have been in an accident. Location: ${payload.mapsLink || 'Unknown'}`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          incidentId: payload.incidentId,
          type: 'emergency_alert',
          severity: payload.severity,
          mapsLink: payload.mapsLink,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });

    return {
      channel: 'push',
      status: 'delivered',
      attemptedAt,
      deliveredAt: Date.now(),
      error: null,
      retryCount: 0,
      messageId: notificationId,
    };
  }
}