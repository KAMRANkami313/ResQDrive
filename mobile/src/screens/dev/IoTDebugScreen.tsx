import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Screen, Text, Card, Button, Spinner } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { IoTDebugScreenProps } from '@nav/types';
import { getIoTService } from '@services/iot';
import { useIoTStatus, useSensorStream } from '@hooks/useIoT';
import { ScenarioInfo, SensorReading } from '@services/iot';
import { Activity, Wifi, WifiOff, Radio, Play, Square, RefreshCw } from 'lucide-react-native';

export function IoTDebugScreen(_props: IoTDebugScreenProps) {
  const theme = useAppTheme();
  const status = useIoTStatus();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [triggeredScenario, setTriggeredScenario] = useState<string | null>(null);
  const reading = useSensorStream(isSubscribed);

  const service = getIoTService();

  const loadScenarios = useCallback(async () => {
    setLoadingScenarios(true);
    try {
      const list = await service.getAvailableScenarios();
      setScenarios(list);
    } catch (err) {
      console.warn('[iot-debug] failed to load scenarios:', err);
    } finally {
      setLoadingScenarios(false);
    }
  }, [service]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const handleConnect = async () => {
    try {
      await service.connect();
      setIsSubscribed(true);
    } catch (err) {
      console.warn('[iot-debug] connect failed:', err);
    }
  };

  const handleDisconnect = async () => {
    await service.disconnect();
    setIsSubscribed(false);
  };

  const handleTrigger = async (scenarioId: string) => {
    const ok = await service.triggerScenario(scenarioId);
    if (ok) {
      setTriggeredScenario(scenarioId);
      setTimeout(() => setTriggeredScenario(null), 3000);
    }
  };

  const handleClear = async () => {
    await service.clearScenario();
    setTriggeredScenario(null);
  };

  const connectionColor =
    status.connection === 'connected'
      ? theme.colors.success
      : status.connection === 'connecting'
      ? theme.colors.warning
      : status.connection === 'error'
      ? theme.colors.emergency
      : theme.colors.textTertiary;

  const ConnectionIcon = status.connection === 'connected' ? Wifi : WifiOff;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loadingScenarios} onRefresh={loadScenarios} />
        }
      >
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              IoT Connection
            </Text>
          </View>
          <View style={styles.row}>
            <ConnectionIcon size={18} color={connectionColor} />
            <Text variant="body" weight="medium" style={{ color: connectionColor, marginLeft: 8 }}>
              {status.connection.toUpperCase()}
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            Source: {status.source}
          </Text>
          {status.errorMessage ? (
            <Text variant="caption" color="emergency" style={styles.errorText}>
              {status.errorMessage}
            </Text>
          ) : null}
          {status.lastReadingAt ? (
            <Text variant="caption" color="secondary">
              Last reading: {new Date(status.lastReadingAt).toLocaleTimeString()}
            </Text>
          ) : null}
          <View style={styles.buttonRow}>
            {status.connection !== 'connected' ? (
              <Button
                label="Connect"
                size="sm"
                variant="primary"
                onPress={handleConnect}
                leftIcon={<Play size={16} color={theme.colors.textOnPrimary} />}
              />
            ) : (
              <Button
                label="Disconnect"
                size="sm"
                variant="outline"
                onPress={handleDisconnect}
                leftIcon={<Square size={16} color={theme.colors.primary} />}
              />
            )}
            <Button
              label="Refresh"
              size="sm"
              variant="ghost"
              onPress={loadScenarios}
              leftIcon={<RefreshCw size={16} color={theme.colors.primary} />}
            />
          </View>
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Radio size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Live Sensor Data
            </Text>
          </View>
          {reading ? (
            <SensorDataView reading={reading} />
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondary">
                {isSubscribed ? 'Waiting for readings...' : 'Connect to see live sensor data'}
              </Text>
              {isSubscribed ? <Spinner size="small" /> : null}
            </View>
          )}
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Play size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Trigger Scenario
            </Text>
          </View>
          {scenarios.length === 0 ? (
            <Text variant="body" color="secondary" style={styles.emptyText}>
              No scenarios loaded. Make sure simulator is running on localhost:9000
            </Text>
          ) : (
            <View style={styles.scenarioGrid}>
              {scenarios.map((scenario) => {
                const isActive = triggeredScenario === scenario.id;
                return (
                  <Button
                    key={scenario.id}
                    label={scenario.label}
                    size="sm"
                    variant={isActive ? 'success' : 'outline'}
                    onPress={() => handleTrigger(scenario.id)}
                    style={styles.scenarioButton}
                  />
                );
              })}
              <Button
                label="Clear (Idle)"
                size="sm"
                variant="ghost"
                onPress={handleClear}
                style={styles.scenarioButton}
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function SensorDataView({ reading }: { reading: SensorReading }) {
  const theme = useAppTheme();
  const accel = reading.accelerometer_g;
  const gyro = reading.gyroscope_rads;
  const gps = reading.gps;

  const accelMag = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
  const gyroMag = Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);

  const DataRow = ({ label, value, unit, highlight }: { label: string; value: string | number; unit?: string; highlight?: boolean }) => (
    <View style={styles.dataRow}>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text variant="body" weight={highlight ? 'bold' : 'medium'} style={highlight ? { color: theme.colors.primary } : undefined}>
        {value}{unit ? ` ${unit}` : ''}
      </Text>
    </View>
  );

  return (
    <View>
      <View style={styles.scenarioTag}>
        <Text variant="caption" color="onPrimary" weight="bold">
          {reading.scenario.toUpperCase()} · {reading.elapsed_in_scenario.toFixed(2)}s
        </Text>
      </View>
      <DataRow label="Accel X" value={accel.x.toFixed(3)} unit="g" />
      <DataRow label="Accel Y" value={accel.y.toFixed(3)} unit="g" />
      <DataRow label="Accel Z" value={accel.z.toFixed(3)} unit="g" />
      <DataRow label="Accel Magnitude" value={accelMag.toFixed(3)} unit="g" highlight />
      <View style={styles.divider} />
      <DataRow label="Gyro X" value={gyro.x.toFixed(3)} unit="rad/s" />
      <DataRow label="Gyro Y" value={gyro.y.toFixed(3)} unit="rad/s" />
      <DataRow label="Gyro Z" value={gyro.z.toFixed(3)} unit="rad/s" />
      <DataRow label="Gyro Magnitude" value={gyroMag.toFixed(3)} unit="rad/s" highlight />
      <View style={styles.divider} />
      <DataRow label="Latitude" value={gps.lat.toFixed(6)} />
      <DataRow label="Longitude" value={gps.lng.toFixed(6)} />
      <DataRow label="Speed" value={gps.speed_kmh.toFixed(1)} unit="km/h" highlight />
      <DataRow label="Heading" value={gps.heading.toFixed(1)} unit="°" />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scenarioButton: {
    minWidth: 140,
  },
  errorText: {
    marginTop: 4,
  },
  scenarioTag: {
    backgroundColor: '#0F4C81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
});