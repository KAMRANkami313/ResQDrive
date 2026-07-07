import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { OfflineFallbackDebugScreenProps } from '@nav/types';
import { networkDetector } from '@services/offline/network-detector';
import { offlineFallbackService } from '@services/offline/offline-fallback.service';
import { QueuedAlert } from '@services/offline/types';
import { Wifi, WifiOff, Mail, MessageSquare, Clock, CircleCheck, CircleAlert, Trash2, Send, RefreshCw } from 'lucide-react-native';

export function OfflineFallbackDebugScreen(_props: OfflineFallbackDebugScreenProps) {
  const theme = useAppTheme();
  const [isOnline, setIsOnline] = useState(networkDetector.isOnline());
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const [manualOffline, setManualOffline] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = useCallback(async () => {
    const q = await offlineFallbackService.getQueue();
    setQueue(q);
  }, []);

  useEffect(() => {
    networkDetector.init();
    loadQueue();

    const unsubNetwork = networkDetector.onChange((state) => {
      setIsOnline(state.isOnline);
    });

    const unsubQueue = offlineFallbackService.onQueueChange((q) => {
      setQueue(q);
    });

    return () => {
      unsubNetwork();
      unsubQueue();
    };
  }, [loadQueue]);

  const toggleManualOffline = () => {
    const next = !manualOffline;
    setManualOffline(next);
    if (next) {
      networkDetector.setManualOverride(false);
      setIsOnline(false);
    } else {
      networkDetector.setManualOverride(null);
      networkDetector.checkNow().then((s) => setIsOnline(s.isOnline));
    }
  };

  const handleFlush = async () => {
    setFlushing(true);
    const result = await offlineFallbackService.flushQueue();
    setFlushing(false);
    await loadQueue();
    window.alert(`Flush complete:\nSent: ${result.sent}\nFailed: ${result.failed}\nSkipped: ${result.skipped}`);
  };

  const handleClear = async () => {
    await offlineFallbackService.clearQueue();
    await loadQueue();
  };

  const handleSimulateQueue = async () => {
    await offlineFallbackService.queueEmail({
      incidentId: `test-${Date.now()}`,
      userId: 'test',
      userName: 'Test User',
      userPhone: '+923001234567',
      severity: 'severe',
      severityScore: 0.85,
      latitude: 33.6844,
      longitude: 73.0479,
      mapsLink: 'https://maps.google.com/?q=33.6844,73.0479',
      occurredAt: Date.now(),
      sensorSnapshot: null,
      recipientName: 'Test Contact',
      recipientEmail: 'contact@example.com',
    });
    await offlineFallbackService.queueSms({
      incidentId: `test-${Date.now()}`,
      userId: 'test',
      userName: 'Test User',
      userPhone: '+923001234567',
      severity: 'severe',
      severityScore: 0.85,
      latitude: 33.6844,
      longitude: 73.0479,
      mapsLink: 'https://maps.google.com/?q=33.6844,73.0479',
      occurredAt: Date.now(),
      sensorSnapshot: null,
      recipientName: 'Test Contact',
      recipientPhone: '+923001234567',
    });
    await loadQueue();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await networkDetector.checkNow();
    await loadQueue();
    setRefreshing(false);
  };

  const networkColor = isOnline ? theme.colors.success : theme.colors.emergency;
  const NetworkIcon = isOnline ? Wifi : WifiOff;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <NetworkIcon size={20} color={networkColor} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Network Status
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: networkColor }]} />
            <Text variant="body" weight="bold" style={{ color: networkColor, marginLeft: 8 }}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            Manual override: {manualOffline ? 'OFFLINE' : 'Auto (real network)'}
          </Text>

          <View style={[styles.manualCard, { backgroundColor: manualOffline ? theme.colors.emergencySoft : theme.colors.surfaceAlt }]}>
            <View style={styles.manualInfo}>
              <Text variant="body" weight="medium">
                {manualOffline ? 'Currently simulating offline' : 'Real network state'}
              </Text>
              <Text variant="caption" color="secondary">
                {manualOffline ? 'Click to restore real network state' : 'Click to simulate offline mode'}
              </Text>
            </View>
            <Button
              label={manualOffline ? 'Go Online' : 'Go Offline'}
              variant={manualOffline ? 'primary' : 'outline'}
              size="sm"
              onPress={toggleManualOffline}
            />
          </View>
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Offline Queue ({queue.length})
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.cardHint}>
            Alerts queued while offline. They'll be sent automatically when network restores.
          </Text>

          <View style={styles.actionRow}>
            <Button
              label="Simulate Queue"
              variant="outline"
              size="sm"
              onPress={handleSimulateQueue}
              leftIcon={<Mail size={14} color={theme.colors.primary} />}
              style={styles.actionButton}
            />
            <Button
              label="Flush Now"
              variant="primary"
              size="sm"
              onPress={handleFlush}
              loading={flushing}
              disabled={flushing || !isOnline || queue.length === 0}
              leftIcon={<Send size={14} color={theme.colors.textOnPrimary} />}
              style={styles.actionButton}
            />
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onPress={handleClear}
              disabled={queue.length === 0}
              leftIcon={<Trash2 size={14} color={theme.colors.emergency} />}
              style={styles.actionButton}
            />
          </View>

          {queue.length === 0 ? (
            <View style={styles.emptyState}>
              <CircleCheck size={32} color={theme.colors.success} />
              <Text variant="body" color="secondary" style={styles.emptyText}>
                Queue is empty
              </Text>
            </View>
          ) : (
            queue.map((alert) => {
              const Icon = alert.type === 'email' ? Mail : MessageSquare;
              const statusColor =
                alert.status === 'sent' ? theme.colors.success :
                alert.status === 'failed' ? theme.colors.emergency :
                alert.status === 'sending' ? theme.colors.warning :
                theme.colors.textTertiary;
              const StatusIcon =
                alert.status === 'sent' ? CircleCheck :
                alert.status === 'failed' ? CircleAlert :
                Clock;
              return (
                <View key={alert.id} style={styles.queueRow}>
                  <View style={[styles.queueIcon, { backgroundColor: statusColor + '20' }]}>
                    <Icon size={14} color={statusColor} />
                  </View>
                  <View style={styles.queueInfo}>
                    <Text variant="caption" weight="medium">
                      {alert.type.toUpperCase()} → {alert.recipientName || alert.recipientEmail || alert.recipientPhone}
                    </Text>
                    <Text variant="caption" color="secondary">
                      Incident: {alert.incidentId.slice(0, 8)}... · Attempts: {alert.attempts}/{alert.maxAttempts}
                    </Text>
                    {alert.error ? (
                      <Text variant="caption" color="emergency">
                        {alert.error}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.queueStatusChip, { backgroundColor: statusColor + '20' }]}>
                    <StatusIcon size={10} color={statusColor} />
                    <Text variant="caption" weight="bold" style={{ color: statusColor, marginLeft: 4 }}>
                      {alert.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <RefreshCw size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How It Works
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">When online:{'\n'}</Text>
            All alerts send normally via internet (push + SMS via Twilio + email via Brevo).{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">When offline:{'\n'}</Text>
            1. Push notifications: skipped (require internet){'\n'}
            2. SMS: sent via native cellular modem (Linking.openURL sms:){'\n'}
            3. Email: queued in local SQLite/localStorage{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">When network restores:{'\n'}</Text>
            NetInfo event fires → OfflineFallbackService.flushQueue() → all queued emails send via Brevo → queue cleared{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Persistence:{'\n'}</Text>
            Queue survives app restarts (stored in SQLite on native, localStorage on web). Failed items retry up to 3 times.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Pakistani context:{'\n'}</Text>
            Designed for highways, tunnels, rural areas with spotty coverage. SMS via cellular works even with no data plan.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  manualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  manualInfo: {
    flex: 1,
    marginRight: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    marginBottom: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  queueIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  queueInfo: {
    flex: 1,
  },
  queueStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  explainerText: {
    lineHeight: 22,
  },
});
