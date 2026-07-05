import { useEffect } from 'react';
import { View, StyleSheet, Vibration } from 'react-native';
import { Text, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { useCountdown } from '@hooks/useCountdown';
import { countdownService } from '@services/countdown';
import { SeverityAssessment } from '@services/severity';
import { X, AlertTriangle, Volume2 } from 'lucide-react-native';

interface CountdownScreenProps {
  onComplete: (assessment: SeverityAssessment) => void;
  onCancel: (reason: string) => void;
}

export function CountdownScreen({ onComplete, onCancel }: CountdownScreenProps) {
  const theme = useAppTheme();
  const state = useCountdown();

  useEffect(() => {
    const unsubComplete = countdownService.onComplete(onComplete);
    const unsubCancel = countdownService.onCancel(onCancel);
    return () => {
      unsubComplete();
      unsubCancel();
    };
  }, [onComplete, onCancel]);

  useEffect(() => {
    if (state.status === 'running') {
      const secondsLeft = Math.ceil(state.remainingMs / 1000);
      if (secondsLeft <= 3 && secondsLeft > 0) {
        Vibration.vibrate(200);
      }
    }
  }, [state.status, state.remainingMs]);

  const secondsLeft = Math.ceil(state.remainingMs / 1000);
  const progress = state.totalMs > 0 ? state.remainingMs / state.totalMs : 0;

  const bgIntensity = state.status === 'running' ? progress : 0.15;
  const isUrgent = secondsLeft <= 3 && state.status === 'running';

  const handleCancel = () => {
    countdownService.cancel('User cancelled via button');
  };

  if (state.status === 'dispatched') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.emergency }]}>
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <AlertTriangle size={64} color="#FFFFFF" />
          </View>
          <Text variant="heading" weight="bold" color="onEmergency" style={styles.title}>
            ALERTS DISPATCHED
          </Text>
          <Text variant="body" color="onEmergency" style={styles.subtitle}>
            Emergency contacts have been notified
          </Text>
        </View>
      </View>
    );
  }

  if (state.status === 'cancelled') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.success }]}>
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <X size={64} color="#FFFFFF" />
          </View>
          <Text variant="heading" weight="bold" color="onPrimary" style={styles.title}>
            FALSE ALARM
          </Text>
          <Text variant="body" color="onPrimary" style={styles.subtitle}>
            {state.cancelReason || 'Countdown cancelled'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isUrgent
          ? `rgba(230, 57, 70, ${0.85 + (1 - progress) * 0.15})`
          : `rgba(230, 57, 70, ${0.7 + bgIntensity * 0.2})`,
      },
    ]}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <AlertTriangle size={56} color="#FFFFFF" />
        </View>

        <Text variant="caption" weight="bold" color="onEmergency" style={styles.label}>
          {state.assessment?.level.toUpperCase() || 'SUSPECTED'} ACCIDENT DETECTED
        </Text>

        <Text
          style={[
            styles.countdownNumber,
            {
              color: '#FFFFFF',
              fontSize: isUrgent ? 180 : 140,
              opacity: state.status === 'running' ? 1 : 0.5,
            },
          ]}
        >
          {secondsLeft}
        </Text>

        <Text variant="body" color="onEmergency" style={styles.message}>
          Tap CANCEL if you're OK{'\n'}
          Emergency alerts will dispatch in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}
        </Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: isUrgent ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                },
              ]}
            />
          </View>
        </View>

        <Button
          label="I'M OK — CANCEL"
          variant="primary"
          size="xl"
          fullWidth
          onPress={handleCancel}
          leftIcon={<X size={24} color={theme.colors.emergency} />}
          style={StyleSheet.flatten([styles.cancelButton, { backgroundColor: '#FFFFFF' }])}
          disabled={state.status !== 'running'}
        />

        <View style={styles.voiceHint}>
          <Volume2 size={14} color="#FFFFFF" />
          <Text variant="caption" color="onEmergency" style={styles.voiceText}>
            Voice cancel coming in Batch 4.4 — say "I am OK" or "Cancel"
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  label: {
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  countdownNumber: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  progressWrap: {
    width: '100%',
    marginBottom: 32,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  cancelButton: {
    marginBottom: 16,
  },
  voiceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.85,
  },
  voiceText: {
    marginLeft: 8,
    textAlign: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});