import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { SeverityDebugScreenProps } from '@nav/types';
import { useDetectionMonitoring } from '@hooks/useDetection';
import { useCrashSoundMonitoring } from '@hooks/useCrashSound';
import { useSeverityAssessment } from '@hooks/useSeverity';
import { severityService } from '@services/severity';
import { getIoTService } from '@services/iot';
import { Activity, Gauge, Compass, TrendingDown, Volume2, AlertTriangle, CircleCheck, CircleAlert, Zap, Play } from 'lucide-react-native';

export function SeverityDebugScreen(_props: SeverityDebugScreenProps) {
  const theme = useAppTheme();
  const { isMonitoring: isDetectionRunning, lastResult: detectionResult, start: startDetection, stop: stopDetection } = useDetectionMonitoring(false);
  const { isMonitoring: isAudioRunning, lastResult: crashSound, start: startAudio, stop: stopAudio } = useCrashSoundMonitoring();
  const assessment = useSeverityAssessment();
  const [triggeredScenario, setTriggeredScenario] = useState<string | null>(null);

  useEffect(() => {
    if (detectionResult && isDetectionRunning) {
      severityService.assess({
        detection: detectionResult,
        crashSound: isAudioRunning ? crashSound : null,
      });
    }
  }, [detectionResult, crashSound, isDetectionRunning, isAudioRunning]);

  const bothRunning = isDetectionRunning && isAudioRunning;

  const handleStartBoth = async () => {
    await startDetection();
    await startAudio();
  };

  const handleStopBoth = async () => {
    await stopDetection();
    await stopAudio();
    severityService.reset();
  };

  const handleTriggerScenario = useCallback(async (scenario: string) => {
    const ok = await getIoTService().triggerScenario(scenario);
    if (ok) {
      setTriggeredScenario(scenario);
      setTimeout(() => setTriggeredScenario(null), 5000);
    }
  }, []);

  const handleClearScenario = useCallback(async () => {
    await getIoTService().clearScenario();
    setTriggeredScenario(null);
  }, []);

  const levelColor =
    assessment?.level === 'severe' ? theme.colors.emergency :
    assessment?.level === 'moderate' ? theme.colors.warning :
    theme.colors.success;

  const LevelIcon = assessment?.level === 'severe' ? CircleAlert : assessment?.level === 'moderate' ? AlertTriangle : CircleCheck;

  const scenarios = [
    { id: 'normal_driving', label: 'Normal', expected: 'minor', color: theme.colors.success },
    { id: 'hard_brake', label: 'Hard Brake', expected: 'minor', color: theme.colors.warning },
    { id: 'front_collision', label: 'Front Crash', expected: 'severe', color: theme.colors.emergency },
    { id: 'side_collision', label: 'Side Crash', expected: 'moderate+', color: theme.colors.emergency },
    { id: 'rollover', label: 'Rollover', expected: 'severe', color: theme.colors.emergency },
    { id: 'fender_bender', label: 'Fender', expected: 'minor', color: theme.colors.warning },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Unified Detection Pipeline
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.cardHint}>
            Run sensor detection + crash sound AI together. Severity service combines both into a single score.
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: bothRunning ? theme.colors.success : theme.colors.textTertiary }]} />
            <Text variant="body" weight="medium" style={{ color: bothRunning ? theme.colors.success : theme.colors.textSecondary, marginLeft: 8 }}>
              {bothRunning ? 'BOTH RUNNING' : 'STOPPED'}
            </Text>
          </View>
          <View style={styles.pipelineRow}>
            <View style={styles.pipelineCell}>
              <Gauge size={14} color={isDetectionRunning ? theme.colors.success : theme.colors.textTertiary} />
              <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                Sensors: {isDetectionRunning ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={styles.pipelineCell}>
              <Volume2 size={14} color={isAudioRunning ? theme.colors.success : theme.colors.textTertiary} />
              <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                Audio: {isAudioRunning ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={styles.pipelineCell}>
              <Zap size={14} color={assessment ? levelColor : theme.colors.textTertiary} />
              <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
                {assessment ? assessment.level.toUpperCase() : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            {!bothRunning ? (
              <Button
                label="Start Both"
                size="sm"
                variant="primary"
                onPress={handleStartBoth}
              />
            ) : (
              <Button
                label="Stop Both"
                size="sm"
                variant="outline"
                onPress={handleStopBoth}
              />
            )}
          </View>
        </Card>

        {bothRunning ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <Play size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Trigger Test Scenarios
              </Text>
            </View>
            <Text variant="caption" color="secondary" style={styles.cardHint}>
              Tap a scenario to simulate. Watch the severity update in real-time.
            </Text>
            <View style={styles.scenarioGrid}>
              {scenarios.map((scenario) => {
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
                    <Text
                      variant="caption"
                      style={{
                        color: isActive ? theme.colors.textOnPrimary : theme.colors.textTertiary,
                        textAlign: 'center',
                        marginTop: 2,
                        fontSize: 10,
                      }}
                    >
                      {scenario.expected}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={handleClearScenario}
                style={[
                  styles.scenarioButton,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: 'transparent' },
                ]}
              >
                <Text variant="label" weight="medium" color="secondary">
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}

        {assessment ? (
          <Card padding="md" elevation="sm" style={[styles.card, { borderColor: levelColor, borderWidth: 1.5 }]}>
            <View style={styles.cardHeader}>
              <LevelIcon size={20} color={levelColor} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Severity Assessment
              </Text>
            </View>

            <View style={[styles.levelBanner, { backgroundColor: levelColor + '20' }]}>
              <Text variant="heading" weight="bold" style={{ color: levelColor }}>
                {assessment.level.toUpperCase()}
              </Text>
              <Text variant="body" color="secondary" style={{ marginTop: 4 }}>
                Score: {(assessment.score * 100).toFixed(1)} / 100
              </Text>
            </View>

            <View style={styles.scoreBar}>
              <View style={styles.scoreBarBg}>
                <View style={[styles.scoreBarFill, {
                  width: `${assessment.score * 100}%`,
                  backgroundColor: levelColor,
                }]} />
              </View>
              <View style={styles.scoreThresholds}>
                <Text variant="caption" color="secondary">minor &lt; {(assessment.thresholds.minor * 100).toFixed(0)}</Text>
                <Text variant="caption" color="secondary">mod &lt; {(assessment.thresholds.moderate * 100).toFixed(0)}</Text>
                <Text variant="caption" color="secondary">sev ≥ {(assessment.thresholds.moderate * 100).toFixed(0)}</Text>
              </View>
            </View>

            <Text variant="label" color="secondary" style={styles.sectionLabel}>
              SCORE COMPONENTS
            </Text>
            <ComponentRow icon={Gauge} label="Acceleration" normalized={assessment.components.gForceNormalized} weight={assessment.weights.gForce} color={theme.colors.primary} />
            <ComponentRow icon={Compass} label="Rotation" normalized={assessment.components.rotationNormalized} weight={assessment.weights.rotation} color={theme.colors.warning} />
            <ComponentRow icon={TrendingDown} label="Speed Drop" normalized={assessment.components.speedDropNormalized} weight={assessment.weights.speedDrop} color={theme.colors.emergency} />
            <ComponentRow icon={Volume2} label="Crash Sound" normalized={assessment.components.soundConfidence} weight={assessment.weights.sound} color={theme.colors.success} />

            <Text variant="label" color="secondary" style={[styles.sectionLabel, { marginTop: 12 }]}>
              REASONING
            </Text>
            {assessment.reasoning.map((reason, idx) => (
              <View key={idx} style={styles.reasonRow}>
                <View style={[styles.bullet, { backgroundColor: levelColor }]} />
                <Text variant="caption" color="secondary" style={{ flex: 1, marginLeft: 8 }}>
                  {reason}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Zap size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How Severity Is Calculated
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">Formula:{'\n'}</Text>
            score = (gForce × 0.40) + (rotation × 0.25){'\n'}
                   + (speedDrop × 0.20) + (sound × 0.15){'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Normalization:{'\n'}</Text>
            • gForce: 0-5g → 0-1{'\n'}
            • rotation: 0-4 rad/s → 0-1{'\n'}
            • speedDrop: 0-80 km/h → 0-1{'\n'}
            • sound: confidence 0-1 (halved if not is_crash){'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Bonus:{'\n'}</Text>
            +0.10 if crash sound detected (is_crash=true){'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Thresholds:{'\n'}</Text>
            • score &lt; 0.40 → MINOR{'\n'}
            • 0.40 ≤ score &lt; 0.70 → MODERATE{'\n'}
            • score ≥ 0.70 → SEVERE{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Why this matters:{'\n'}</Text>
            Severity determines which contacts are notified, whether rescue is auto-dialed, and whether location sharing auto-activates.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function ComponentRow({ icon: Icon, label, normalized, weight, color }: { icon: typeof Gauge; label: string; normalized: number; weight: number; color: string }) {
  const contribution = normalized * weight;
  return (
    <View style={styles.componentRow}>
      <Icon size={14} color={color} />
      <Text variant="caption" style={{ flex: 1, marginLeft: 8 }}>
        {label}
      </Text>
      <View style={styles.componentBar}>
        <View style={[styles.componentBarFill, {
          width: `${normalized * 100}%`,
          backgroundColor: color,
        }]} />
      </View>
      <Text variant="caption" weight="medium" style={{ minWidth: 50, textAlign: 'right' }}>
        {(contribution * 100).toFixed(1)}
      </Text>
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
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pipelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pipelineCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 8,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scenarioButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 100,
    minHeight: 56,
    justifyContent: 'center',
  },
  levelBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreBar: {
    marginBottom: 16,
  },
  scoreBarBg: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  scoreThresholds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  componentBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  componentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  explainerText: {
    lineHeight: 22,
  },
});