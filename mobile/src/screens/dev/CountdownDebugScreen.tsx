import { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { CountdownDebugScreenProps } from '@nav/types';
import { countdownService } from '@services/countdown';
import { useCountdown } from '@hooks/useCountdown';
import { severityService } from '@services/severity';
import { SeverityAssessment } from '@services/severity';
import { Clock, Play, X, RotateCcw, AlertTriangle } from 'lucide-react-native';

export function CountdownDebugScreen(_props: CountdownDebugScreenProps) {
  const theme = useAppTheme();
  const state = useCountdown();
  

  const mockAssessments: Record<string, SeverityAssessment> = {
    minor: {
      level: 'minor',
      score: 0.25,
      components: {
        gForceNormalized: 0.2,
        rotationNormalized: 0.1,
        speedDropNormalized: 0.15,
        soundConfidence: 0.05,
      },
      weights: { gForce: 0.4, rotation: 0.25, speedDrop: 0.2, sound: 0.15 },
      thresholds: { minor: 0.4, moderate: 0.7 },
      reasoning: ['Mock assessment for testing — minor severity'],
      timestamp: Date.now(),
    },
    moderate: {
      level: 'moderate',
      score: 0.55,
      components: {
        gForceNormalized: 0.6,
        rotationNormalized: 0.5,
        speedDropNormalized: 0.55,
        soundConfidence: 0.4,
      },
      weights: { gForce: 0.4, rotation: 0.25, speedDrop: 0.2, sound: 0.15 },
      thresholds: { minor: 0.4, moderate: 0.7 },
      reasoning: ['Mock assessment for testing — moderate severity'],
      timestamp: Date.now(),
    },
    severe: {
      level: 'severe',
      score: 0.82,
      components: {
        gForceNormalized: 0.85,
        rotationNormalized: 0.75,
        speedDropNormalized: 0.9,
        soundConfidence: 0.7,
      },
      weights: { gForce: 0.4, rotation: 0.25, speedDrop: 0.2, sound: 0.15 },
      thresholds: { minor: 0.4, moderate: 0.7 },
      reasoning: ['Mock assessment for testing — severe severity'],
      timestamp: Date.now(),
    },
  };

  const triggerCountdown = (level: 'minor' | 'moderate' | 'severe') => {
    const assessment = mockAssessments[level];
    severityService.assess({
      detection: {
        isSuspected: true,
        anomalies: [],
        maxAccelMagnitude: assessment.components.gForceNormalized * 5,
        maxGyroMagnitude: assessment.components.rotationNormalized * 4,
        maxSpeedDrop: assessment.components.speedDropNormalized * 80,
        reading: {
          timestamp: new Date().toISOString(),
          source: 'simulator',
          scenario: 'mock',
          elapsed_in_scenario: 0,
          accelerometer_g: { x: 0, y: 0, z: 1 },
          gyroscope_rads: { x: 0, y: 0, z: 0 },
          gps: { lat: 0, lng: 0, speed_kmh: 0, accuracy: 0, heading: 0 },
        },
      },
      crashSound: null,
    });
    countdownService.start(assessment);
  };

  const handleCancel = () => {
    countdownService.cancel('Cancelled from debug screen');
  };

  const handleReset = () => {
    countdownService.reset();
  };

  useEffect(() => {
    return () => {
      countdownService.reset();
    };
  }, []);

  const progress = state.totalMs > 0 ? state.remainingMs / state.totalMs : 0;

  const statusColor =
    state.status === 'running' ? theme.colors.emergency :
    state.status === 'cancelled' ? theme.colors.success :
    state.status === 'dispatched' ? theme.colors.emergency :
    theme.colors.textTertiary;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Countdown State
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text variant="body" weight="medium" style={{ color: statusColor, marginLeft: 8 }}>
              {state.status.toUpperCase()}
            </Text>
          </View>
          {state.status === 'running' || state.status === 'dispatched' ? (
            <>
              <Text variant="caption" color="secondary">
                Remaining: {(state.remainingMs / 1000).toFixed(2)}s / {(state.totalMs / 1000).toFixed(1)}s
              </Text>
              <Text variant="caption" color="secondary">
                Severity: {state.assessment?.level.toUpperCase() || '—'} (score: {((state.assessment?.score || 0) * 100).toFixed(1)}%)
              </Text>
              <View style={styles.progressWrap}>
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceAlt }]}>
                  <View style={[styles.progressFill, {
                    width: `${progress * 100}%`,
                    backgroundColor: statusColor,
                  }]} />
                </View>
              </View>
            </>
          ) : null}
          {state.status === 'cancelled' && state.cancelReason ? (
            <Text variant="caption" color="secondary" style={styles.reasonText}>
              Cancel reason: {state.cancelReason}
            </Text>
          ) : null}
        </Card>

        {state.status === 'idle' ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <Play size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Trigger Countdown
              </Text>
            </View>
            <Text variant="caption" color="secondary" style={styles.cardHint}>
              Tap a button below to simulate a suspected accident. The 10-second countdown will appear as a full-screen overlay.
            </Text>
            <View style={styles.triggerGrid}>
              <Button
                label="Minor Accident"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => triggerCountdown('minor')}
                leftIcon={<AlertTriangle size={18} color={theme.colors.success} />}
                style={styles.triggerButton}
              />
              <Button
                label="Moderate Accident"
                variant="outline"
                size="md"
                fullWidth
                onPress={() => triggerCountdown('moderate')}
                leftIcon={<AlertTriangle size={18} color={theme.colors.warning} />}
                style={styles.triggerButton}
              />
              <Button
                label="Severe Accident"
                variant="emergency"
                size="md"
                fullWidth
                onPress={() => triggerCountdown('severe')}
                leftIcon={<AlertTriangle size={18} color={theme.colors.textOnEmergency} />}
                style={styles.triggerButton}
              />
            </View>
          </Card>
        ) : null}

        {state.status === 'running' ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <X size={20} color={theme.colors.emergency} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Cancel Countdown
              </Text>
            </View>
            <Text variant="caption" color="secondary" style={styles.cardHint}>
              Tap cancel to simulate a false alarm. This is what users will do when the detection was wrong.
            </Text>
            <Button
              label="CANCEL COUNTDOWN"
              variant="emergency"
              size="lg"
              fullWidth
              onPress={handleCancel}
              leftIcon={<X size={20} color={theme.colors.textOnEmergency} />}
            />
          </Card>
        ) : null}

        {state.status === 'cancelled' || state.status === 'dispatched' ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <RotateCcw size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Reset
              </Text>
            </View>
            <Text variant="caption" color="secondary" style={styles.cardHint}>
              Reset the countdown to test again.
            </Text>
            <Button
              label="Reset Countdown"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleReset}
              leftIcon={<RotateCcw size={20} color={theme.colors.textOnPrimary} />}
            />
          </Card>
        ) : null}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How It Works
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">When suspected accident detected:{'\n'}</Text>
            1. CountdownService starts with severity assessment{'\n'}
            2. Full-screen 10-second countdown overlay appears{'\n'}
            3. Color shifts from red → bright red as time runs out{'\n'}
            4. Vibration at 3, 2, 1 seconds remaining{'\n'}
            5. User taps "I'M OK — CANCEL" → false alarm logged{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">If countdown reaches 0:{'\n'}</Text>
            • Status → DISPATCHED{'\n'}
            • In Batch 3.1: triggers EmergencyAlertDispatch{'\n'}
            • Sends push + SMS + email to emergency contacts{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Voice cancel (Batch 4.4):{'\n'}</Text>
            User can say "I am OK" or "Cancel" — no touch required{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Why 10 seconds?{'\n'}</Text>
            Long enough to cancel a false alarm (iPhone Crash Detection's problem){'\n'}
            Short enough to dispatch help quickly in real accidents
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
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reasonText: {
    marginTop: 8,
  },
  progressWrap: {
    marginTop: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  triggerGrid: {
    gap: 8,
  },
  triggerButton: {
    marginBottom: 0,
  },
  explainerText: {
    lineHeight: 22,
  },
});