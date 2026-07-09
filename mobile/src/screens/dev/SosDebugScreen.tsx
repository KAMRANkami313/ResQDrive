import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { SosDebugScreenProps } from '@nav/types';
import { useSos } from '@hooks/useSos';
import { sosService, detectRegion } from '@services/sos';
import { Phone, MapPin, Play, Square,Shield, Globe } from 'lucide-react-native';

const TEST_LOCATIONS = [
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Lahore (Punjab)', lat: 31.5204, lng: 74.3587 },
  { name: 'Peshawar (KPK)', lat: 34.0151, lng: 71.5249 },
  { name: 'Quetta (Balochistan)', lat: 30.1798, lng: 66.9750 },
  { name: 'Default (unknown)', lat: 28.0, lng: 70.0 },
];

export function SosDebugScreen(_props: SosDebugScreenProps) {
  const theme = useAppTheme();
  const state = useSos();
  const [activating, setActivating] = useState(false);

  const handleActivate = async (lat: number, lng: number, name: string) => {
    setActivating(true);
    const { region, label } = detectRegion(lat, lng);
    console.log('[sos-debug] activating for', name, '→ region:', region, label);
    await sosService.activate(`test-${Date.now()}`, lat, lng);
    setActivating(false);
  };

  const handleDismiss = () => {
    sosService.dismiss();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Shield size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              SOS Status
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, {
              backgroundColor: state.isActive ? theme.colors.emergency : theme.colors.textTertiary,
            }]} />
            <Text variant="body" weight="bold" style={{
              color: state.isActive ? theme.colors.emergency : theme.colors.textSecondary,
              marginLeft: 8,
            }}>
              {state.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
          {state.isActive ? (
            <>
              <Text variant="caption" color="secondary">
                Region: {state.regionLabel} ({state.region})
              </Text>
              <Text variant="caption" color="secondary">
                Numbers loaded: {state.emergencyNumbers.length}
              </Text>
              {state.autoDialCountdown !== null ? (
                <Text variant="caption" weight="bold" style={{ color: theme.colors.warning, marginTop: 4 }}>
                  Auto-dial in: {state.autoDialCountdown}s
                </Text>
              ) : null}
              {state.autoDialTriggered ? (
                <Text variant="caption" weight="bold" style={{ color: theme.colors.emergency, marginTop: 4 }}>
                  Auto-dial TRIGGERED
                </Text>
              ) : null}
            </>
          ) : null}
        </Card>

        {!state.isActive ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <Play size={20} color={theme.colors.primary} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Activate SOS by Location
              </Text>
            </View>
            <Text variant="caption" color="secondary" style={styles.cardHint}>
              Tap a city to simulate an accident in that region. The SOS overlay will appear with the correct local emergency numbers.
            </Text>
            <View style={styles.locationGrid}>
              {TEST_LOCATIONS.map((loc) => {
                detectRegion(loc.lat, loc.lng);
                return (
                  <Button
                    key={loc.name}
                    label={loc.name}
                    variant="outline"
                    size="sm"
                    fullWidth
                    onPress={() => handleActivate(loc.lat, loc.lng, loc.name)}
                    loading={activating}
                    disabled={activating}
                    leftIcon={<MapPin size={14} color={theme.colors.primary} />}
                    style={styles.locationButton}
                  />
                );
              })}
            </View>
          </Card>
        ) : (
          <Card padding="md" elevation="sm" style={styles.card}>
            <View style={styles.cardHeader}>
              <Square size={20} color={theme.colors.emergency} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Emergency Numbers
              </Text>
            </View>
            {state.emergencyNumbers.map((number) => (
              <View key={number.id} style={styles.numberRow}>
                <View style={styles.numberInfo}>
                  <Text variant="title" weight="bold" style={{ color: theme.colors.emergency }}>
                    {number.phone}
                  </Text>
                  <Text variant="body" weight="medium">
                    {number.serviceName}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {number.description}
                  </Text>
                </View>
                <Button
                  label="Call"
                  variant="emergency"
                  size="sm"
                  onPress={() => sosService.callNumber(number.phone, number.serviceName)}
                  leftIcon={<Phone size={14} color={theme.colors.textOnEmergency} />}
                />
              </View>
            ))}
            <Button
              label="DISMISS SOS"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleDismiss}
              leftIcon={<Square size={18} color={theme.colors.textOnPrimary} />}
              style={styles.dismissButton}
            />
          </Card>
        )}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Globe size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Pakistani Regions
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">Region detection:{'\n'}</Text>
            The app uses GPS coordinates to detect which Pakistani region the user is in, then shows the correct emergency numbers:{'\n'}
            {'\n'}
            • Punjab / Islamabad / KPK → Rescue 1122{'\n'}
            • Karachi / Sindh → Edhi 115, Chhipa 1020{'\n'}
            • Balochistan → Edhi 115{'\n'}
            • Default → Rescue 1122, Edhi 115{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Auto-dial:{'\n'}</Text>
            After 60 seconds, if no emergency contact has acknowledged the alert, the app auto-dials the top regional emergency number via the native phone dialer (cellular call, no internet required).{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Custom numbers:{'\n'}</Text>
            Users can add custom emergency numbers in settings (e.g., family doctor, local police station). These appear alongside the regional numbers.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Web limitation:{'\n'}</Text>
            On web, tel: links show an alert instead of dialing (browsers can't make phone calls). On mobile, it opens the native dialer.
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
  locationGrid: {
    gap: 8,
  },
  locationButton: {
    marginBottom: 0,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  numberInfo: {
    flex: 1,
    marginRight: 12,
  },
  dismissButton: {
    marginTop: 12,
  },
  explainerText: {
    lineHeight: 22,
  },
});