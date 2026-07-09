import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { useSos } from '@hooks/useSos';
import { sosService } from '@services/sos';
import { Phone, MapPin, X, Clock, AlertTriangle, Shield } from 'lucide-react-native';

export function SosOverlay() {
  const theme = useAppTheme();
  const state = useSos();

  if (!state.isActive) return null;

  const handleCall = async (phone: string, serviceName: string) => {
    await sosService.callNumber(phone, serviceName);
  };

  const handleDismiss = () => {
    sosService.dismiss();
  };

  const allNumbers = [...state.emergencyNumbers, ...state.customNumbers];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.emergency }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <AlertTriangle size={48} color="#FFFFFF" />
          </View>
          <Text variant="heading" weight="bold" color="onEmergency" style={styles.title}>
            EMERGENCY SOS
          </Text>
          <Text variant="body" color="onEmergency" style={styles.subtitle}>
            Call emergency services immediately
          </Text>
        </View>

        <View style={[styles.regionCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <View style={styles.regionRow}>
            <MapPin size={16} color="#FFFFFF" />
            <Text variant="body" weight="semibold" color="onEmergency" style={styles.regionText}>
              {state.regionLabel}
            </Text>
          </View>
        </View>

        {state.autoDialCountdown !== null && state.autoDialCountdown > 0 ? (
          <View style={[styles.autoDialCard, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Clock size={20} color="#FFFFFF" />
            <View style={styles.autoDialInfo}>
              <Text variant="body" weight="bold" color="onEmergency">
                Auto-dial in {state.autoDialCountdown}s
              </Text>
              <Text variant="caption" color="onEmergency" style={{ opacity: 0.85 }}>
                Calling top emergency number automatically if no response
              </Text>
            </View>
          </View>
        ) : null}

        {state.autoDialTriggered ? (
          <View style={[styles.autoDialCard, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
            <Shield size={20} color="#FFFFFF" />
            <View style={styles.autoDialInfo}>
              <Text variant="body" weight="bold" color="onEmergency">
                Auto-dial triggered
              </Text>
              <Text variant="caption" color="onEmergency" style={{ opacity: 0.85 }}>
                Calling {state.emergencyNumbers[0]?.serviceName || 'emergency services'}...
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.numbersList}>
          <Text variant="label" weight="bold" color="onEmergency" style={styles.sectionLabel}>
            EMERGENCY NUMBERS ({allNumbers.length})
          </Text>
          {allNumbers.map((number) => (
            <View key={number.id} style={[styles.numberCard, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.numberInfo}>
                <Text variant="title" weight="bold" style={{ color: theme.colors.emergency }}>
                  {number.phone}
                </Text>
                <Text variant="body" weight="semibold">
                  {number.serviceName}
                </Text>
                {number.description ? (
                  <Text variant="caption" color="secondary">
                    {number.description}
                  </Text>
                ) : null}
              </View>
              <Button
                label="CALL"
                variant="emergency"
                size="md"
                onPress={() => handleCall(number.phone, number.serviceName)}
                leftIcon={<Phone size={16} color={theme.colors.textOnEmergency} />}
              />
            </View>
          ))}
        </View>

        <Button
          label="DISMISS"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleDismiss}
          leftIcon={<X size={20} color={theme.colors.textOnPrimary} />}
          style={[styles.dismissButton, { backgroundColor: '#FFFFFF' }]}
        />

        <Text variant="caption" color="onEmergency" style={styles.hint}>
          Tap DISMISS if you've received help or are safe.{'\n'}
          Auto-dial triggers automatically after {Math.floor(sosService.getState().autoDialCountdown ?? 0)}s if no response.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.9,
  },
  regionCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionText: {
    marginLeft: 8,
  },
  autoDialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  autoDialInfo: {
    marginLeft: 12,
    flex: 1,
  },
  numbersList: {
    marginBottom: 24,
  },
  sectionLabel: {
    marginBottom: 12,
    opacity: 0.9,
  },
  numberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  numberInfo: {
    flex: 1,
    marginRight: 12,
  },
  dismissButton: {
    marginBottom: 16,
  },
  hint: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 18,
  },
});