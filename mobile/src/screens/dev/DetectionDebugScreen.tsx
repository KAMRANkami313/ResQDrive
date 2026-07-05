import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { DetectionDebugScreenProps } from '@nav/types';
import { useDetectionMonitoring } from '@hooks/useDetection';
import { useIoTStatus } from '@hooks/useIoT';
import { detectionService } from '@services/detection';
import { getIoTService } from '@services/iot';
import { DetectionResult, DEFAULT_DETECTION_CONFIG } from '@services/detection';
import {
  Activity,
  Play,
  Square,
  AlertTriangle,
  Gauge,
  Compass,
  TrendingDown,
  Zap,
  CircleCheck,
  CircleAlert,
} from 'lucide-react-native';

export function DetectionDebugScreen(_props: DetectionDebugScreenProps) {
  const theme = useAppTheme();
  const iotStatus = useIoTStatus();
  const {
    isMonitoring,
    lastResult,
    suspectedCount,
    start,
    stop,
    resetSuspectedCount,
  } = useDetectionMonitoring(false);
  const [triggeredScenario, setTriggeredScenario] = useState<string | null>(null);

  const handleTriggerScenario = useCallback(async (scenario: string) => {
    const ok = await getIoTService().triggerScenario(scenario);
    if (ok) {
      setTriggeredScenario(scenario);
      setTimeout(() => setTriggeredScenario(null), 5000);
    }
  }, []);

  const handleClear = useCallback(async () => {
    await getIoTService().clearScenario();
    setTriggeredScenario(null);
  }, []);

  const triggerScenarios = [
    { id: 'normal_driving', label: 'Normal Driving', color: theme.colors.success },
    { id: 'hard_brake', label: 'Hard Brake (no crash)', color: theme.colors.warning },
    { id: 'front_collision', label: 'Front Collision', color: theme.colors.emergency },
    { id: 'side_collision', label: 'Side Collision', color: theme.colors.emergency },
    { id: 'rollover', label: 'Rollover', color: theme.colors.emergency },
    { id: 'fender_bender', label: 'Fender Bender', color: theme.colors.warning },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Detection Engine
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, {
              backgroundColor: isMonitoring ? theme.colors.success : theme.colors.textTertiary,
            }]} />
            <Text variant="body" weight="medium" style={styles.statusText}>
              {isMonitoring ? 'MONITORING' : 'STOPPED'}
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            IoT Source: {iotStatus.source} · {iotStatus.connection}
          </Text>
          {isMonitoring ? (
            <Text variant="caption" color="secondary">
              Buffer: {detectionService.getBufferSize()} readings
            </Text>
          ) : null}
          <View style={styles.buttonRow}>
            {!isMonitoring ? (
              <Button
                label="Start Monitoring"
                size="sm"
                variant="primary"
                onPress={start}
                leftIcon={<Play size={16} color={theme.colors.textOnPrimary} />}
              />
            ) : (
              <Button
                label="Stop Monitoring"
                size="sm"
                variant="outline"
                onPress={stop}
                leftIcon={<Square size={16} color={theme.colors.primary} />}
              />
            )}
          </View>
        </Card>

        {isMonitoring && lastResult ? (
          <DetectionResultCard result={lastResult} />
        ) : null}

        {suspectedCount > 0 ? (
          <Card padding="md" elevation="sm" style={[styles.card, styles.suspectedCard]}>
            <View style={styles.cardHeader}>
              <AlertTriangle size={20} color={theme.colors.emergency} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Suspected Accidents: {suspectedCount}
              </Text>
            </View>
            <Text variant="caption" color="secondary">
              Total suspected events fired since monitoring started
            </Text>
            <Button
              label="Reset Counter"
              size="sm"
              variant="ghost"
              onPress={resetSuspectedCount}
              style={styles.resetButton}
            />
          </Card>
        ) : null}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Zap size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Test Scenarios
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.cardHint}>
            Trigger simulator scenarios to see detection in action
          </Text>
          <View style={styles.scenarioGrid}>
            {triggerScenarios.map((scenario) => {
              const isActive = triggeredScenario === scenario.id;
              return (
                <TouchableOpacity
                  key={scenario.id}
                  onPress={() => handleTriggerScenario(scenario.id)}
                  style={[
                    styles.scenarioButton,
                    {
                      backgroundColor: isActive ? scenario.color : theme.colors.surfaceAlt,
                      borderColor: isActive ? scenario.color : 'transparent',
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    weight="semibold"
                    style={{
                      color: isActive ? theme.colors.textOnPrimary : theme.colors.textPrimary,
                      textAlign: 'center',
                    }}
                  >
                    {scenario.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={handleClear}
              style={[
                styles.scenarioButton,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: 'transparent' },
              ]}
            >
              <Text variant="label" weight="medium" color="secondary">
                Clear (Idle)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Gauge size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Detection Thresholds
            </Text>
          </View>
          <ThresholdRow label="Acceleration" value={`${DEFAULT_DETECTION_CONFIG.accelThresholdG} g`} icon={Gauge} />
          <ThresholdRow label="Rotation" value={`${DEFAULT_DETECTION_CONFIG.gyroThresholdRadS} rad/s`} icon={Compass} />
          <ThresholdRow label="Speed Drop" value={`${DEFAULT_DETECTION_CONFIG.speedDropThresholdKmh} km/h`} icon={TrendingDown} />
          <ThresholdRow label="Speed Drop Window" value={`${DEFAULT_DETECTION_CONFIG.speedDropWindowMs / 1000}s`} icon={TrendingDown} />
          <ThresholdRow label="Min Anomalies" value={`${DEFAULT_DETECTION_CONFIG.minAnomaliesForSuspected}`} icon={AlertTriangle} />
          <ThresholdRow label="Cooldown" value={`${DEFAULT_DETECTION_CONFIG.cooldownMs / 1000}s`} icon={Activity} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

function DetectionResultCard({ result }: { result: DetectionResult }) {
  const theme = useAppTheme();
  const a = result.reading.accelerometer_g;
  const g = result.reading.gyroscope_rads;
  const gps = result.reading.gps;

  const accelMag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  const gyroMag = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);

  const anomalyIcons: Record<string, typeof Gauge> = {
    acceleration: Gauge,
    rotation: Compass,
    speed_drop: TrendingDown,
  };

  const StatusIcon = result.isSuspected ? CircleAlert : CircleCheck;
  const statusColor = result.isSuspected ? theme.colors.emergency : theme.colors.success;

  return (
    <Card padding="md" elevation="sm" style={styles.card}>
      <View style={styles.cardHeader}>
        <StatusIcon size={20} color={statusColor} />
        <Text variant="title" weight="semibold" style={styles.cardTitle}>
          Live Detection
        </Text>
      </View>

      <View style={[styles.statusBanner, { backgroundColor: statusColor + '20' }]}>
        <Text variant="body" weight="bold" style={{ color: statusColor }}>
          {result.isSuspected ? 'SUSPECTED ACCIDENT' : 'NORMAL'}
        </Text>
        <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
          {result.reading.scenario.toUpperCase()} · {result.reading.elapsed_in_scenario.toFixed(2)}s
        </Text>
      </View>

      {result.anomalies.length > 0 ? (
        <View style={styles.anomalyList}>
          <Text variant="label" color="secondary" style={styles.sectionLabel}>
            ACTIVE ANOMALIES ({result.anomalies.length})
          </Text>
          {result.anomalies.map((anomaly, idx) => {
            const Icon = anomalyIcons[anomaly.type] || AlertTriangle;
            return (
              <View key={idx} style={styles.anomalyRow}>
                <Icon size={14} color={theme.colors.emergency} />
                <Text variant="caption" style={{ flex: 1, marginLeft: 8 }}>
                  {anomaly.type.replace('_', ' ').toUpperCase()}: {anomaly.value.toFixed(2)} (threshold: {anomaly.threshold})
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.metricsGrid}>
        <MetricCell label="Accel Mag" value={accelMag.toFixed(2)} unit="g" highlight={accelMag >= DEFAULT_DETECTION_CONFIG.accelThresholdG} />
        <MetricCell label="Gyro Mag" value={gyroMag.toFixed(2)} unit="rad/s" highlight={gyroMag >= DEFAULT_DETECTION_CONFIG.gyroThresholdRadS} />
        <MetricCell label="Speed" value={gps.speed_kmh.toFixed(1)} unit="km/h" />
        <MetricCell label="Max Accel" value={result.maxAccelMagnitude.toFixed(2)} unit="g" />
        <MetricCell label="Max Gyro" value={result.maxGyroMagnitude.toFixed(2)} unit="rad/s" />
        <MetricCell label="Max Speed Drop" value={result.maxSpeedDrop.toFixed(1)} unit="km/h" />
      </View>
    </Card>
  );
}

function MetricCell({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  const theme = useAppTheme();
  return (
    <View style={styles.metricCell}>
      <Text variant="caption" color="secondary">{label}</Text>
      <Text variant="body" weight="bold" style={{ color: highlight ? theme.colors.emergency : theme.colors.textPrimary }}>
        {value}
        <Text variant="caption" color="secondary"> {unit}</Text>
      </Text>
    </View>
  );
}

function ThresholdRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Gauge }) {
  const theme = useAppTheme();
  return (
    <View style={styles.thresholdRow}>
      <Icon size={16} color={theme.colors.primary} />
      <Text variant="body" color="secondary" style={{ flex: 1, marginLeft: 8 }}>
        {label}
      </Text>
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
    marginRight: 8,
  },
  statusText: {
    color: '#1A1D29',
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
  suspectedCard: {
    borderColor: '#E63946',
    borderWidth: 1.5,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  anomalyList: {
    marginBottom: 12,
  },
  sectionLabel: {
    marginBottom: 6,
  },
  anomalyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCell: {
    flex: 1,
    minWidth: '47%',
    padding: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scenarioButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 140,
    minHeight: 44,
    justifyContent: 'center',
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
});