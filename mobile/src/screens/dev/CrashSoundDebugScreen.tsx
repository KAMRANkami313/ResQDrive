import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { CrashSoundDebugScreenProps } from '@nav/types';
import { useCrashSoundMonitoring, useCrashSoundHealthCheck } from '@hooks/useCrashSound';
import { Mic, MicOff, Activity, Volume2, Server, AlertTriangle, CircleCheck, CircleAlert, RefreshCw } from 'lucide-react-native';

export function CrashSoundDebugScreen(_props: CrashSoundDebugScreenProps) {
  const theme = useAppTheme();
  const { isMonitoring, status, lastResult, crashCount, start, stop, resetCrashCount } = useCrashSoundMonitoring();
  const { isHealthy, checking, check } = useCrashSoundHealthCheck();

  const statusColor =
    status === 'recording' ? theme.colors.success :
    status === 'analyzing' ? theme.colors.warning :
    status === 'error' ? theme.colors.emergency :
    theme.colors.textTertiary;

  const StatusIcon = status === 'recording' ? Mic : status === 'analyzing' ? Activity : status === 'error' ? AlertTriangle : MicOff;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Server size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              AI Service Status
            </Text>
          </View>
          <View style={styles.serviceRow}>
            <View style={[styles.statusDot, { backgroundColor: isHealthy === null ? theme.colors.textTertiary : isHealthy ? theme.colors.success : theme.colors.emergency }]} />
            <Text variant="body" weight="medium" style={styles.serviceText}>
              {isHealthy === null ? 'Checking...' : isHealthy ? 'Online (localhost:8001)' : 'Offline'}
            </Text>
            <Button
              label="Retry"
              size="sm"
              variant="ghost"
              onPress={check}
              loading={checking}
              leftIcon={<RefreshCw size={14} color={theme.colors.primary} />}
              style={styles.retryButton}
            />
          </View>
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <StatusIcon size={20} color={statusColor} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Audio Monitoring
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text variant="body" weight="medium" style={{ color: statusColor, marginLeft: 8 }}>
              {status.toUpperCase()}
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            Records 2-second audio chunks every 2 seconds
          </Text>
          <View style={styles.buttonRow}>
            {!isMonitoring ? (
              <Button
                label="Start Monitoring"
                size="sm"
                variant="primary"
                onPress={start}
                leftIcon={<Mic size={16} color={theme.colors.textOnPrimary} />}
              />
            ) : (
              <Button
                label="Stop Monitoring"
                size="sm"
                variant="outline"
                onPress={stop}
                leftIcon={<MicOff size={16} color={theme.colors.primary} />}
              />
            )}
          </View>
        </Card>

        {crashCount > 0 ? (
          <Card padding="md" elevation="sm" style={[styles.card, styles.crashCard]}>
            <View style={styles.cardHeader}>
              <AlertTriangle size={20} color={theme.colors.emergency} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Crash Sounds Detected: {crashCount}
              </Text>
            </View>
            <Button
              label="Reset Counter"
              size="sm"
              variant="ghost"
              onPress={resetCrashCount}
              style={styles.resetButton}
            />
          </Card>
        ) : null}

        {lastResult ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <Volume2 size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Last Analysis
              </Text>
            </View>

            <View style={[styles.resultBanner, { backgroundColor: lastResult.is_crash ? theme.colors.emergencySoft : theme.colors.successSoft }]}>
              {lastResult.is_crash ? (
                <CircleAlert size={20} color={theme.colors.emergency} />
              ) : (
                <CircleCheck size={20} color={theme.colors.success} />
              )}
              <View style={styles.resultInfo}>
                <Text variant="body" weight="bold" style={{ color: lastResult.is_crash ? theme.colors.emergency : theme.colors.success }}>
                  {lastResult.is_crash ? 'CRASH SOUND DETECTED' : 'NO CRASH SOUND'}
                </Text>
                <Text variant="caption" color="secondary">
                  Confidence: {(lastResult.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCell}>
                <Text variant="caption" color="secondary">Processing</Text>
                <Text variant="body" weight="semibold">{lastResult.processing_time_ms} ms</Text>
              </View>
              <View style={styles.metricCell}>
                <Text variant="caption" color="secondary">Duration</Text>
                <Text variant="body" weight="semibold">{lastResult.audio_duration_s.toFixed(2)}s</Text>
              </View>
              <View style={styles.metricCell}>
                <Text variant="caption" color="secondary">Sample Rate</Text>
                <Text variant="body" weight="semibold">{lastResult.sample_rate} Hz</Text>
              </View>
            </View>

            {lastResult.detected_classes.length > 0 ? (
              <View style={styles.classesSection}>
                <Text variant="label" color="secondary" style={styles.sectionLabel}>
                  DETECTED SOUND CLASSES
                </Text>
                {lastResult.detected_classes.slice(0, 5).map((cls, idx) => (
                  <View key={idx} style={styles.classRow}>
                    <Text variant="caption" style={{ flex: 1, textTransform: 'capitalize' }}>
                      {cls.label.replace('_', ' ')}
                    </Text>
                    <View style={styles.confidenceBar}>
                      <View style={[styles.confidenceFill, {
                        width: `${Math.min(100, cls.confidence * 100)}%`,
                        backgroundColor: cls.confidence > 0.6 ? theme.colors.emergency : theme.colors.warning,
                      }]} />
                    </View>
                    <Text variant="caption" weight="medium" style={{ minWidth: 40, textAlign: 'right' }}>
                      {(cls.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {lastResult.error ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.emergencySoft }]}>
                <Text variant="caption" color="emergency">{lastResult.error}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How It Works
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            1. Records 2-second audio chunk via microphone{'\n'}
            2. Sends WAV file to Python AI service{'\n'}
            3. Service extracts log-mel spectrogram + spectral features{'\n'}
            4. Classifier detects crash-like patterns{'\n'}
            5. Returns: is_crash flag + confidence + sound classes{'\n'}
            {'\n'}
            Try playing a crash sound near your mic while monitoring!
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceText: {
    flex: 1,
    marginLeft: 8,
  },
  retryButton: {},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  resetButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  crashCard: {
    borderColor: '#E63946',
    borderWidth: 1.5,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  resultInfo: {
    marginLeft: 8,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCell: {
    flex: 1,
    padding: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
  },
  classesSection: {
    marginBottom: 8,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  explainerText: {
    lineHeight: 22,
  },
});