import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { AlertDispatchDebugScreenProps } from '@nav/types';
import { alertDispatchService, buildAlertPayload } from '@services/alert';
import { useAlertDispatch } from '@hooks/useAlertDispatch';
import { severityService } from '@services/severity';
import { getIoTService } from '@services/iot';
import { Send, Bell, MessageSquare, Mail, CircleCheck, CircleAlert, Clock, RefreshCw, Loader } from 'lucide-react-native';
import { AlertChannelResult, AlertChannelType } from '@services/alert';

export function AlertDispatchDebugScreen(_props: AlertDispatchDebugScreenProps) {
  const theme = useAppTheme();
  const { lastDispatch, channelStatuses} = useAlertDispatch();
  const [dispatching, setDispatching] = useState(false);

  const handleDispatch = async (severityLevel: 'minor' | 'moderate' | 'severe') => {
    setDispatching(true);
    try {
      const latestReading = getIoTService().getStatus().lastReadingAt
        ? null
        : null;

      const mockAssessment = severityService.assess({
        detection: {
          isSuspected: true,
          anomalies: [],
          maxAccelMagnitude: severityLevel === 'severe' ? 4.5 : severityLevel === 'moderate' ? 2.5 : 1.0,
          maxGyroMagnitude: severityLevel === 'severe' ? 3.5 : severityLevel === 'moderate' ? 1.8 : 0.5,
          maxSpeedDrop: severityLevel === 'severe' ? 70 : severityLevel === 'moderate' ? 45 : 15,
          reading: {
            timestamp: new Date().toISOString(),
            source: 'simulator',
            scenario: 'mock',
            elapsed_in_scenario: 0,
            accelerometer_g: { x: 0, y: 0, z: 1 },
            gyroscope_rads: { x: 0, y: 0, z: 0 },
            gps: { lat: 33.6844, lng: 73.0479, speed_kmh: 0, accuracy: 5, heading: 0 },
          },
        },
        crashSound: null,
      });

      const payload = await buildAlertPayload(mockAssessment, latestReading);
      await alertDispatchService.dispatch(payload);
    } catch (err) {
      console.error('[alert-debug] dispatch failed:', err);
    } finally {
      setDispatching(false);
    }
  };

  const channels: { type: AlertChannelType; label: string; icon: typeof Bell }[] = [
    { type: 'push', label: 'Push Notification', icon: Bell },
    { type: 'sms', label: 'SMS (Twilio)', icon: MessageSquare },
    { type: 'email', label: 'Email (Brevo)', icon: Mail },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Send size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Trigger Alert Dispatch
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.cardHint}>
            Tap a severity level to dispatch emergency alerts through all 3 channels (push, SMS, email) simultaneously. Channels run in mock mode if API keys are not configured.
          </Text>
          <View style={styles.triggerGrid}>
            <Button
              label="Minor Alert"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => handleDispatch('minor')}
              loading={dispatching}
              disabled={dispatching}
              style={styles.triggerButton}
            />
            <Button
              label="Moderate Alert"
              variant="warning"
              size="md"
              fullWidth
              onPress={() => handleDispatch('moderate')}
              loading={dispatching}
              disabled={dispatching}
              style={styles.triggerButton}
            />
            <Button
              label="Severe Alert"
              variant="emergency"
              size="md"
              fullWidth
              onPress={() => handleDispatch('severe')}
              loading={dispatching}
              disabled={dispatching}
              style={styles.triggerButton}
            />
          </View>
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Channel Status
            </Text>
          </View>
          {channels.map(({ type, label, icon: Icon }) => {
            const status = channelStatuses[type];
            return (
              <ChannelRow
                key={type}
                icon={Icon}
                label={label}
                result={status}
                theme={theme}
              />
            );
          })}
        </Card>

        {lastDispatch ? (
          <Card padding="md" elevation="sm" style={[styles.card, { borderColor: theme.colors.primary, borderWidth: 1.5 }]}>
            <View style={styles.cardHeader}>
              <CircleCheck size={20} color={theme.colors.success} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Last Dispatch Result
              </Text>
            </View>
            <View style={styles.dispatchRow}>
              <Text variant="caption" color="secondary">Incident ID</Text>
              <Text variant="body" weight="medium">{lastDispatch.incidentId.slice(0, 8)}...</Text>
            </View>
            <View style={styles.dispatchRow}>
              <Text variant="caption" color="secondary">Dispatched At</Text>
              <Text variant="body" weight="medium">
                {new Date(lastDispatch.dispatchedAt).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.dispatchRow}>
              <Text variant="caption" color="secondary">Overall Status</Text>
              <Text
                variant="body"
                weight="bold"
                style={{
                  color: lastDispatch.overallStatus === 'success'
                    ? theme.colors.success
                    : lastDispatch.overallStatus === 'partial'
                    ? theme.colors.warning
                    : theme.colors.emergency,
                }}
              >
                {lastDispatch.overallStatus.toUpperCase()}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <RefreshCw size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How It Works
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">Parallel dispatch:{'\n'}</Text>
            All 3 channels (push, SMS, email) fire simultaneously via Promise.all — not sequentially. This minimizes total delivery time.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Retry on failure:{'\n'}</Text>
            Failed channels automatically retry up to 3 times with 60s delay.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Mock mode:{'\n'}</Text>
            Without Twilio/Brevo API keys in .env, SMS and email channels simulate success after a short delay. Add real keys to enable actual delivery.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Audit trail:{'\n'}</Text>
            Every dispatch creates an incident record in Supabase with the full sensor snapshot, severity, and per-channel delivery status.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Wiring (next batch):{'\n'}</Text>
            Batch 3.2 will wire this to the CountdownService — when countdown reaches zero, dispatch fires automatically.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function ChannelRow({
  icon: Icon,
  label,
  result,
  theme,
}: {
  icon: typeof Bell;
  label: string;
  result: AlertChannelResult | null;
  theme: any;
}) {
  const status = result?.status || 'pending';
  const statusColor =
    status === 'delivered' ? theme.colors.success :
    status === 'sent' ? theme.colors.success :
    status === 'failed' ? theme.colors.emergency :
    status === 'retrying' ? theme.colors.warning :
    status === 'sending' ? theme.colors.primary :
    theme.colors.textTertiary;

  const StatusIcon =
    status === 'delivered' || status === 'sent' ? CircleCheck :
    status === 'failed' ? CircleAlert :
    status === 'sending' || status === 'retrying' ? Loader :
    Clock;

  return (
    <View style={styles.channelRow}>
      <View style={[styles.channelIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
        <Icon size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.channelInfo}>
        <Text variant="body" weight="medium">{label}</Text>
        {result ? (
          <Text variant="caption" color="secondary">
            {result.error || `${status}${result.messageId ? ` · ${result.messageId.slice(0, 16)}...` : ''}${result.retryCount > 0 ? ` · retry ${result.retryCount}` : ''}`}
          </Text>
        ) : (
          <Text variant="caption" color="secondary">Not yet dispatched</Text>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <StatusIcon size={12} color={statusColor} />
        <Text variant="caption" weight="bold" style={{ color: statusColor, marginLeft: 4 }}>
          {status.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
  },
  cardHint: {
    marginBottom: 12,
  },
  triggerGrid: {
    gap: 8,
  },
  triggerButton: {
    marginBottom: 0,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dispatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  explainerText: {
    lineHeight: 22,
  },
});