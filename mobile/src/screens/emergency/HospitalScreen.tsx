import { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Screen, Text, Card, Button, Spinner } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { HospitalScreenProps } from '@nav/types';
import { useHospitals } from '@hooks/useHospitals';
import { hospitalService } from '@services/places';
import { Hospital } from '@services/places';
import { MapPin, Phone, Navigation, Clock, Building2, CircleCheck, AlertTriangle } from 'lucide-react-native';

export function HospitalScreen(_props: HospitalScreenProps) {
  const theme = useAppTheme();
  const [, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const lat = 33.6844;
  const lng = 73.0479;

  const { hospitals, loading, error } = useHospitals(lat, lng);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleNavigate = async (hospital: Hospital) => {
    await hospitalService.openNavigation(hospital);
  };

  const handleCall = async (phone: string) => {
    await hospitalService.callHospital(phone);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Building2 size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              Nearest Hospitals
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            Showing the 3 closest hospitals with emergency departments near your location.
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color={theme.colors.textTertiary} />
            <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
              Location: {lat.toFixed(4)}, {lng.toFixed(4)}
            </Text>
          </View>
        </Card>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Spinner size="large" />
            <Text variant="body" color="secondary" style={styles.loadingText}>
              Searching OpenStreetMap for nearby hospitals...
            </Text>
          </View>
        ) : error ? (
          <Card padding="md" elevation="sm" style={[styles.card, { borderColor: theme.colors.emergency, borderWidth: 1.5 }]}>
            <View style={styles.cardHeader}>
              <AlertTriangle size={20} color={theme.colors.emergency} />
              <Text variant="title" weight="semibold" style={styles.cardTitle}>
                Search Error
              </Text>
            </View>
            <Text variant="body" color="secondary">
              {error}
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 8 }}>
              Showing cached hospital database instead.
            </Text>
          </Card>
        ) : null}

        {!loading && hospitals.length === 0 ? (
          <Card padding="md" elevation="sm" style={styles.card}>
            <Text variant="body" color="secondary" style={{ textAlign: 'center', paddingVertical: 24 }}>
              No hospitals found nearby. Try refreshing.
            </Text>
          </Card>
        ) : null}

        {hospitals.map((hospital, idx) => (
          <HospitalCard
            key={hospital.id}
            hospital={hospital}
            rank={idx + 1}
            theme={theme}
            onNavigate={() => handleNavigate(hospital)}
            onCall={hospital.phone ? () => handleCall(hospital.phone!) : undefined}
          />
        ))}

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.cardHeader}>
            <Navigation size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.cardTitle}>
              How It Works
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.explainerText}>
            <Text variant="caption" weight="bold">Data source:{'\n'}</Text>
            OpenStreetMap Overpass API (free, no API key). Searches within 15km radius for hospitals tagged with emergency=yes.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Fallback:{'\n'}</Text>
            If Overpass API fails (network issues, rate limits), falls back to pre-cached database of major Pakistani hospitals (18 entries across Islamabad, Karachi, Lahore, Peshawar, Quetta).{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Distance calculation:{'\n'}</Text>
            Haversine formula (great-circle distance). ETA estimated assuming 30 km/h average urban speed.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Navigation:{'\n'}</Text>
            One-tap opens native maps app (Google Maps on Android, Apple Maps on iOS) with turn-by-turn driving directions. Web opens Google Maps in browser.{'\n'}
            {'\n'}
            <Text variant="caption" weight="bold">Auto-suggest:{'\n'}</Text>
            After moderate/severe accident confirmed, this screen auto-opens so bystanders or victims can reach emergency care without searching manually.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function HospitalCard({
  hospital,
  rank,
  theme,
  onNavigate,
  onCall,
}: {
  hospital: Hospital;
  rank: number;
  theme: any;
  onNavigate: () => void;
  onCall?: () => void;
}) {
  const rankColor = rank === 1 ? theme.colors.success : rank === 2 ? theme.colors.primary : theme.colors.warning;
  const rankBadge = rank === 1 ? 'NEAREST' : rank === 2 ? '2ND' : '3RD';

  return (
    <Card padding="md" elevation="sm" style={[styles.card, rank === 1 && { borderColor: rankColor, borderWidth: 1.5 }]}>
      <View style={styles.hospitalHeader}>
        <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
          <Text variant="label" weight="bold" color="onPrimary">
            {rankBadge}
          </Text>
        </View>
        <View style={styles.hospitalInfo}>
          <Text variant="title" weight="semibold" style={styles.hospitalName}>
            {hospital.name}
          </Text>
          {hospital.hasEmergencyDept ? (
            <View style={styles.emergencyBadge}>
              <CircleCheck size={10} color={theme.colors.success} />
              <Text variant="caption" weight="bold" style={{ color: theme.colors.success, marginLeft: 4 }}>
                EMERGENCY DEPT
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCell, { backgroundColor: theme.colors.surfaceAlt }]}>
          <MapPin size={12} color={theme.colors.primary} />
          <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
            Distance
          </Text>
          <Text variant="body" weight="bold">
            {hospital.distanceKm.toFixed(2)} km
          </Text>
        </View>
        <View style={[styles.metricCell, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Clock size={12} color={theme.colors.primary} />
          <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
            ETA
          </Text>
          <Text variant="body" weight="bold">
            ~{hospital.estimatedEtaMin} min
          </Text>
        </View>
        <View style={[styles.metricCell, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Building2 size={12} color={theme.colors.primary} />
          <Text variant="caption" color="secondary" style={{ marginLeft: 4 }}>
            Source
          </Text>
          <Text variant="caption" weight="medium">
            {hospital.source.toUpperCase()}
          </Text>
        </View>
      </View>

      {hospital.address ? (
        <Text variant="caption" color="secondary" style={styles.addressText}>
          {hospital.address}
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Button
          label="Navigate"
          variant="primary"
          size="sm"
          onPress={onNavigate}
          leftIcon={<Navigation size={14} color={theme.colors.textOnPrimary} />}
          style={styles.actionButton}
        />
        {onCall ? (
          <Button
            label="Call"
            variant="outline"
            size="sm"
            onPress={onCall}
            leftIcon={<Phone size={14} color={theme.colors.primary} />}
            style={styles.actionButton}
          />
        ) : null}
      </View>
    </Card>
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
    marginBottom: 8,
  },
  cardTitle: {
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 2,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    marginBottom: 4,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCell: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  addressText: {
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  explainerText: {
    lineHeight: 22,
  },
});