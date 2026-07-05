import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Screen, Text, Card, Button, EmptyState, Spinner } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { VehiclesScreenProps } from '@nav/types';
import { useVehicles, useDeleteVehicle, useSetPrimaryVehicle } from '@hooks/useVehicles';
import { useAuth } from '@hooks/useAuth';
import { confirmDialog } from '@utils/confirm';
import { Vehicle } from '@app-types/index';
import { Car, Plus, Star, Trash2, ChevronRight, Calendar, Hash } from 'lucide-react-native';

export function VehiclesScreen({ navigation }: VehiclesScreenProps) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { data: vehicles, isLoading, refetch, isRefetching } = useVehicles();
  const deleteVehicle = useDeleteVehicle();
  const setPrimary = useSetPrimaryVehicle();

  const handleDelete = (vehicle: Vehicle) => {
    confirmDialog(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.make} ${vehicle.model}? This cannot be undone.`,
      async () => {
        await deleteVehicle.mutateAsync(vehicle.id);
      },
      'Delete',
      'Cancel',
    );
  };

  const handleSetPrimary = async (vehicle: Vehicle) => {
    if (vehicle.is_primary) return;
    await setPrimary.mutateAsync(vehicle.id);
  };

  const renderItem = ({ item }: { item: Vehicle }) => (
    <Card padding="md" elevation="sm" style={styles.card}>
      <TouchableOpacity
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
        style={styles.cardContent}
        activeOpacity={0.7}
      >
        <View style={[styles.vehicleIcon, { backgroundColor: theme.colors.primarySoft }]}>
          <Car size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleHeader}>
            <Text variant="body" weight="semibold" style={styles.vehicleName}>
              {item.make} {item.model}
            </Text>
            {item.is_primary ? (
              <View style={[styles.primaryBadge, { backgroundColor: theme.colors.successSoft }]}>
                <Star size={10} color={theme.colors.success} />
                <Text variant="caption" weight="bold" style={{ color: theme.colors.success, marginLeft: 3 }}>
                  PRIMARY
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <Calendar size={12} color={theme.colors.textTertiary} />
            <Text variant="caption" color="secondary" style={styles.metaText}>
              {item.year}
            </Text>
            <Hash size={12} color={theme.colors.textTertiary} style={styles.metaIcon} />
            <Text variant="caption" color="secondary" style={styles.metaText}>
              {item.license_plate}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>
      <View style={styles.cardActions}>
        {!item.is_primary ? (
          <Button
            label="Set Primary"
            variant="ghost"
            size="sm"
            onPress={() => handleSetPrimary(item)}
            loading={setPrimary.isPending && setPrimary.variables === item.id}
            leftIcon={<Star size={14} color={theme.colors.primary} />}
          />
        ) : null}
        <Button
          label="Delete"
          variant="ghost"
          size="sm"
          onPress={() => handleDelete(item)}
          loading={deleteVehicle.isPending && deleteVehicle.variables === item.id}
          leftIcon={<Trash2 size={14} color={theme.colors.emergency} />}
          style={styles.deleteButton}
        />
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Spinner fullScreen />
        </View>
      </Screen>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <Screen>
        <View style={styles.container}>
          <EmptyState
            icon={<Car size={40} color={theme.colors.primary} />}
            title="No vehicles yet"
            message="Add your vehicle to enable accident detection and quick emergency response."
            actionLabel="Add Vehicle"
            onAction={() => navigation.navigate('AddVehicle', {})}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="title" weight="semibold">
              {user?.full_name?.split(' ')[0] || 'Driver'}'s Vehicles
            </Text>
            <Text variant="caption" color="secondary">
              {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} registered
            </Text>
          </View>
          <Button
            label="Add"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('AddVehicle', {})}
            leftIcon={<Plus size={16} color={theme.colors.textOnPrimary} />}
          />
        </View>

        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    flex: 1,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginLeft: 12,
  },
  metaText: {
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  deleteButton: {
    marginLeft: 'auto',
  },
});