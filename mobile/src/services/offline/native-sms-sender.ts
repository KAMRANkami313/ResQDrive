import { Platform, Linking } from 'react-native';
import { QueuedAlert } from './types';

export const nativeSmsSender = {
  async send(phone: string, message: string): Promise<{ success: boolean; error: string | null }> {
    if (Platform.OS === 'web') {
      try {
        window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_blank');
        return { success: true, error: null };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    try {
      const url = Platform.OS === 'ios'
        ? `sms:${phone}&body=${encodeURIComponent(message)}`
        : `sms:${phone}?body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        return { success: false, error: 'SMS not supported on this device' };
      }
      await Linking.openURL(url);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  buildMessage(alert: QueuedAlert): string {
    try {
      const payload = JSON.parse(alert.payload);
      const severity = payload.severity?.toUpperCase() || 'UNKNOWN';
      const userName = payload.userName || 'A ResQDrive user';
      const mapsLink = payload.mapsLink || 'Location unavailable';
      return `ResQDrive EMERGENCY: ${userName} may have been in a ${severity} accident. Location: ${mapsLink}`;
    } catch {
      return `ResQDrive EMERGENCY: An accident has been reported. Check your email for details.`;
    }
  },
};