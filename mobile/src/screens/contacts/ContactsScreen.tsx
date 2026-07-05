import { View, StyleSheet } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { Phone, Plus } from 'lucide-react-native';

export function ContactsScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Card padding="xl" elevation="sm" style={styles.emptyCard}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.emergencySoft }]}>
            <Phone size={40} color={theme.colors.emergency} />
          </View>
          <Text variant="title" weight="semibold" style={styles.title}>
            No emergency contacts
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Add up to 5 emergency contacts. They'll be notified instantly if an accident is detected.
          </Text>
          <Button
            label="Add Contact"
            size="md"
            variant="emergency"
            leftIcon={<Plus size={18} color={theme.colors.textOnEmergency} />}
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