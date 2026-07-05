import { View, StyleSheet } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { Car, Plus } from 'lucide-react-native';

export function VehiclesScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Card padding="xl" elevation="sm" style={styles.emptyCard}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
            <Car size={40} color={theme.colors.primary} />
          </View>
          <Text variant="title" weight="semibold" style={styles.title}>
            No vehicles yet
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Add your vehicle to enable accident detection and quick emergency response.
          </Text>
          <Button
            label="Add Vehicle"
            size="md"
            variant="primary"
            leftIcon={<Plus size={18} color={theme.colors.textOnPrimary} />}
            style={styles.button}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    minWidth: 180,
  },
});