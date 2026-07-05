import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { useAuth } from '@hooks/useAuth';
import { Shield, Car, Phone, FileText, ChevronRight, CircleCheck } from 'lucide-react-native';

export function HomeScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();

  const menuItems = [
    { id: 'vehicles', label: 'My Vehicles', icon: Car, color: theme.colors.primary },
    { id: 'contacts', label: 'Emergency Contacts', icon: Phone, color: theme.colors.emergency },
    { id: 'incidents', label: 'Incident History', icon: FileText, color: theme.colors.warning },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Shield size={32} color={theme.colors.primary} />
          </View>
          <Text variant="title" weight="bold" style={styles.heroTitle}>
            Hi, {user?.full_name?.split(' ')[0] || 'Driver'}
          </Text>
          <Text variant="body" color="secondary">
            Driving mode is off. Tap below to start monitoring.
          </Text>
        </View>

        <Button
          label="Start Driving Mode"
          fullWidth
          size="xl"
          variant="primary"
          style={styles.cta}
        />

        <View style={styles.section}>
          <Text variant="title" weight="semibold" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} padding="md" elevation="sm" style={styles.menuCard}>
                <View style={styles.menuRow}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                    <Icon size={22} color={item.color} />
                  </View>
                  <Text variant="body" weight="medium" style={styles.menuLabel}>
                    {item.label}
                  </Text>
                  <ChevronRight size={20} color={theme.colors.textTertiary} />
                </View>
              </Card>
            );
          })}
        </View>

        <Card padding="md" elevation="sm" style={styles.statusCard}>
          <Text variant="label" color="secondary">SYSTEM STATUS</Text>
          <View style={styles.statusRow}>
            <CircleCheck size={16} color={theme.colors.success} />
            <Text variant="body" weight="medium" style={styles.statusText}>
              All systems operational
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.statusHint}>
            Connected to ResQDrive cloud
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    marginBottom: 4,
  },
  cta: {
    marginTop: 8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  menuCard: {
    marginBottom: 0,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
  },
  statusCard: {
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  statusText: {
    marginLeft: 8,
  },
  statusHint: {
    marginTop: 4,
  },
});