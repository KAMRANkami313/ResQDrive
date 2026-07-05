import { View, StyleSheet } from 'react-native';
import { Screen, Text, Card } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { FileText } from 'lucide-react-native';

export function IncidentHistoryScreen() {
  const theme = useAppTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Card padding="xl" elevation="sm" style={styles.emptyCard}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.warningSoft }]}>
            <FileText size={40} color={theme.colors.warning} />
          </View>
          <Text variant="title" weight="semibold" style={styles.title}>
            No incidents recorded
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            When an accident is detected or manually reported, it will appear here with full details, sensor data, and PDF export options.
          </Text>
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
  },
});