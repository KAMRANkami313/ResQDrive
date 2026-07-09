import { useState } from 'react';
import { View, StyleSheet, ScrollView} from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { LocationShareDebugScreenProps } from '@nav/types';
import { useLocationShare } from '@hooks/useLocationShare';
import { locationShareService } from '@services/location-share';
import { incidentService } from '@services/alert';
import { getIoTService } from '@services/iot';
import { MapPin, Share2, Link as LinkIcon, Copy, Play, Square, Clock, Navigation,CircleAlert } from 'lucide-react-native';

export function LocationShareDebugScreen(_props: LocationShareDebugScreenProps) {
  const theme = useAppTheme();
  const state = useLocationShare();
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const iotService = getIoTService();
      if (iotService.getStatus().connection !== 'connected') {
        await iotService.connect();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const incident = await incidentService.create({
        vehicleId: null,
        severity: 'severe',
        severityScore: 0.85,
        latitude: 33.6844,
        longitude: 73.0479,
        address: 'Islamabad',
        sensorSnapshot: null,
      });
      if (!incident) {
        window.alert('Failed to create incident');
        return;
      }
      const result = await locationShareService.start(incident.id);
      if (!result) {
        window.alert('Failed to start location share');
      }
    } catch (err) {
      window.alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = () => {
    locationShareService.stop('manual_stop_from_debug');
  };

  const handleCopyLink = () => {
    if (state.shareUrl) {
      navigator.clipboard.writeText(state.shareUrl);
      window.alert('Link copied to clipboard:\n\n' + state.shareUrl);
    }
  };

  const handleOpenLink = () => {
    if (state.shareUrl) {
      window.open(state.shareUrl, '_blank');
    }
  };

  const handleTriggerMovement = async () => {
    await getIoTService().triggerScenario('normal_driving');
  };

  const statusColor = state.isActive
    ? (state.phase === 'fast' ? theme.colors.success : theme.colors.warning)
    : theme.colors.textTertiary;

  const StatusIcon = state.isActive ? Navigation : MapPin;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <StatusIcon size={20} color={statusColor} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Location Share Status
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text variant="body" weight="bold" style={{ color: statusColor, marginLeft: 8 }}>
              {state.isActive ? `ACTIVE (${state.phase.toUpperCase()})` : 'INACTIVE'}
            </Text>
          </View>
          {state.incidentId ? (
            <Text variant="caption" color="secondary">
              Incident: {state.incidentId.slice(0, 8)}...
            </Text>
          ) : null}
          {state.startedAt ? (
            <Text variant="caption" color="secondary">
              Started: {new Date(state.startedAt).toLocaleTimeString()}
            </Text>
          ) : null}
          {state.lastUpdateAt ? (
            <Text variant="caption" color="secondary">
              Last update: {new Date(state.lastUpdateAt).toLocaleTimeString()}
            </Text>
          ) : null}
          <Text variant="caption" color="secondary">
            Updates sent: {state.updateCount}
          </Text>
          {state.errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.emergencySoft }]}>
              <CircleAlert size={14} color={theme.colors.emergency} />
              <Text variant="caption" color="emergency" style={{ marginLeft: 8, flex: 1 }}>
                {state.errorMessage}
              </Text>
            </View>
          ) : null}
        </Card>

        {state.shareUrl ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <LinkIcon size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Share Link
              </Text>
            </View>
            <View style={[styles.linkBox, { backgroundColor: theme.colors.surfaceAlt }]}>
              <Text variant="caption" weight="medium" style={{ flex: 1 }} numberOfLines={2}>
                {state.shareUrl}
              </Text>
            </View>
            <View style={styles.linkActions}>
              <Button
                label="Copy"
                variant="outline"
                size="sm"
                onPress={handleCopyLink}
                leftIcon={<Copy size={14} color={theme.colors.primary} />}
                style={styles.linkButton}
              />
              <Button
                label="Open in New Tab"
                variant="primary"
                size="sm"
                onPress={handleOpenLink}
                leftIcon={<Share2 size={14} color={theme.colors.textOnPrimary} />}
                style={styles.linkButton}
              />
            </View>
            <Text variant="caption" color="secondary" style={styles.linkHint}>
              Anyone with this link can view the live location (no app install required). In production, this URL would be sent to emergency contacts via SMS/email.
            </Text>
          </Card>
        ) : null}

        {state.currentLocation ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <MapPin size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Current Location
              </Text>
            </View>
            <DataRow label="Latitude" value={state.currentLocation.latitude.toFixed(6)} />
            <DataRow label="Longitude" value={state.currentLocation.longitude.toFixed(6)} />
            <DataRow label="Speed" value={`${state.currentLocation.speedKmh.toFixed(1)} km/h`} />
            <DataRow label="Heading" value={`${state.currentLocation.heading.toFixed(1)}°`} />
            <DataRow label="Accuracy" value={`±${state.currentLocation.accuracy.toFixed(1)} m`} />
          </Card>
        ) : null}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Play size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Controls
            </Text>
          </View>
          {!state.isActive ? (
            <Button
              label="Start Location Share"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleStart}
              loading={starting}
              disabled={starting}
              leftIcon={<Play size={20} color={theme.colors.textOnPrimary} />}
              style={styles.actionButton}
            />
          ) : (
            <>
              <Button
                label="Stop Location Share"
                variant="emergency"
                size="lg"
                fullWidth
                onPress={handleStop}
                leftIcon={<Square size={20} color={theme.colors.textOnEmergency} />}
                style={styles.actionButton}
              />
              <Button
                label="Simulate Movement (Normal Driving)"
                variant="outline"
                size="md"
                fullWidth
                onPress={handleTriggerMovement}
                leftIcon={<Navigation size={16} color={theme.colors.primary} />}
                style={styles.actionButton}
              />
            </>
          )}
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How It Works
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">Trigger:{'\n'}</Text>
            Auto-activates for moderate/severe accidents (after countdown completes).{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Update frequency:{'\n'}</Text>
            • First 10 min: every 5s (fast phase, real-time tracking){'\n'}
            • After 10 min: every 30s (slow phase, battery conservation){'\n'}
            • Auto-ends after 2h inactivity{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Web viewer:{'\n'}</Text>
            Each share has a unique token URL: https://resqdrive.app/track/{'{token}'}{'\n'}
            Contacts open this in any browser — no app install required.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Map:{'\n'}</Text>
            OpenStreetMap (free, no API key) + Leaflet for the web viewer.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Realtime:{'\n'}</Text>
            Web viewer subscribes to Supabase Realtime on location_shares table. Updates appear instantly.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Privacy:{'\n'}</Text>
            Share link is unguessable (UUID). Only people who receive the link can view location. User can stop sharing anytime.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text variant="caption" color="secondary">{label}</Text>
      <Text variant="body" weight="medium">{value}</Text>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  linkBox: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  linkButton: {
    flex: 1,
  },
  linkHint: {
    lineHeight: 18,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  actionButton: {
    marginBottom: 8,
  },
  explainerText: {
    lineHeight: 22,
  },
});