import { View, StyleSheet, ScrollView} from 'react-native';
import { Screen, Text, Card, Button, Spinner, EmptyState } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { VehicleDetailScreenProps } from '@nav/types';
import { useVehicles, useSetPrimaryVehicle, useDeleteVehicle } from '@hooks/useVehicles';
import { confirmDialog } from '@utils/confirm';
import { Car, Calendar, Hash, Palette, Shield, FileText, Star, Pencil, Trash2 } from 'lucide-react-native';

export function VehicleDetailScreen({ navigation, route }: VehicleDetailScreenProps) {
  const theme = useAppTheme();
  const { vehicleId } = route.params;
  const { data: vehicles, isLoading } = useVehicles();
  const setPrimary = useSetPrimaryVehicle();
  const deleteVehicle = useDeleteVehicle();

  const vehicle = vehicles?.find((v) => v.id === vehicleId);

  if (isLoading) {
    return (
      <Screen>
        <Spinner fullScreen />
      </Screen>
    );
  }

  if (!vehicle) {
    return (
      <Screen>
        <EmptyState
          icon={<Car size={40} color={theme.colors.primary} />}
          title="Vehicle not found"
          message="This vehicle may have been deleted."
          actionLabel="Back to Vehicles"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const details = [
    { icon: Calendar, label: 'Year', value: vehicle.year.toString() },
    { icon: Palette, label: 'Color', value: vehicle.color || 'Not specified' },
    { icon: Hash, label: 'License Plate', value: vehicle.license_plate },
    { icon: FileText, label: 'VIN', value: vehicle.vin || 'Not specified' },
  ];

  const insurance = [
    { label: 'Provider', value: vehicle.insurance_provider || 'Not specified' },
    { label: 'Policy Number', value: vehicle.insurance_policy_number || 'Not specified' },
    { label: 'Expiry', value: vehicle.insurance_expiry || 'Not specified' },
  ];

  const handleDelete = () => {
    confirmDialog(
      'Delete Vehicle',
      `Delete ${vehicle.make} ${vehicle.model}? This cannot be undone.`,
      async () => {
        await deleteVehicle.mutateAsync(vehicle.id);
        navigation.goBack();
      },
      'Delete',
      'Cancel',
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: theme.colors.primarySoft }]}>
          <View style={[styles.vehicleIcon, { backgroundColor: theme.colors.surface }]}>
            <Car size={32} color={theme.colors.primary} />
          </View>
          <Text variant="heading" weight="bold" style={styles.vehicleName}>
            {vehicle.make} {vehicle.model}
          </Text>
          <Text variant="body" color="secondary">
            {vehicle.year} · {vehicle.color}
          </Text>
          {vehicle.is_primary ? (
            <View style={[styles.primaryBadge, { backgroundColor: theme.colors.success }]}>
              <Star size={12} color={theme.colors.textOnPrimary} />
              <Text variant="caption" weight="bold" color="onPrimary" style={{ marginLeft: 4 }}>
                PRIMARY VEHICLE
              </Text>
            </View>
          ) : null}
        </View>

        <Card padding="md" elevation="sm" style={styles.card}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            VEHICLE DETAILS
          </Text>
          {details.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={[
                  styles.detailRow,
                  idx < details.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                ]}
              >
                <View style={[styles.detailIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
                  <Icon size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text variant="caption" color="secondary">{item.label}</Text>
                  <Text variant="body" weight="medium">{item.value}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={theme.colors.primary} />
            <Text variant="label" color="secondary" style={styles.sectionTitleInline}>
              INSURANCE INFORMATION
            </Text>
          </View>
          {insurance.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.detailRow,
                idx < insurance.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.detailContent}>
                <Text variant="caption" color="secondary">{item.label}</Text>
                <Text variant="body" weight="medium">{item.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            TIMELINE
          </Text>
          <View style={styles.detailRow}>
            <View style={styles.detailContent}>
              <Text variant="caption" color="secondary">Added on</Text>
              <Text variant="body" weight="medium">
                {new Date(vehicle.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>
          {vehicle.updated_at !== vehicle.created_at ? (
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={styles.detailContent}>
                <Text variant="caption" color="secondary">Last updated</Text>
                <Text variant="body" weight="medium">
                  {new Date(vehicle.updated_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>
          ) : null}
        </Card>

        <View style={styles.actions}>
          {!vehicle.is_primary ? (
            <Button
              label="Set as Primary"
              variant="outline"
              size="md"
              fullWidth
              onPress={() => setPrimary.mutate(vehicle.id)}
              loading={setPrimary.isPending}
              leftIcon={<Star size={18} color={theme.colors.primary} />}
              style={styles.actionButton}
            />
          ) : null}
          <Button
            label="Edit Vehicle"
            variant="primary"
            size="md"
            fullWidth
            onPress={() => navigation.navigate('AddVehicle', { vehicleId: vehicle.id })}
            leftIcon={<Pencil size={18} color={theme.colors.textOnPrimary} />}
            style={styles.actionButton}
          />
          <Button
            label="Delete Vehicle"
            variant="emergency"
            size="md"
            fullWidth
            onPress={handleDelete}
            loading={deleteVehicle.isPending}
            leftIcon={<Trash2 size={18} color={theme.colors.textOnEmergency} />}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  vehicleIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vehicleName: {
    marginBottom: 4,
    textAlign: 'center',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleInline: {
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  actions: {
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    marginBottom: 0,
  },
});