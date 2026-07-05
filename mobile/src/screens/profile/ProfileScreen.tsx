import { View, StyleSheet } from 'react-native';
import { confirmDialog } from '@utils/confirm';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { useAuth } from '@hooks/useAuth';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { User, Mail, Phone, LogOut, Shield } from 'lucide-react-native';

export function ProfileScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const clear = useAuthStore((s) => s.clear);

const handleLogout = () => {
  confirmDialog(
    'Sign Out',
    'Are you sure you want to sign out?',
    async () => {
      await authService.signOut();
      clear();
    },
    'Sign Out',
    'Cancel',
  );
};

  const infoItems = [
    { icon: Mail, label: 'Email', value: user?.email ?? '—' },
    { icon: Phone, label: 'Phone', value: user?.phone || '—' },
    { icon: Shield, label: 'Role', value: (user?.role ?? 'driver').toUpperCase() },
  ];

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primarySoft }]}>
            <User size={32} color={theme.colors.primary} />
          </View>
          <Text variant="title" weight="bold" style={styles.name}>
            {user?.full_name || 'ResQDrive User'}
          </Text>
          <Text variant="body" color="secondary">
            {user?.email}
          </Text>
        </View>

        <Card padding="lg" elevation="sm" style={styles.card}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            ACCOUNT DETAILS
          </Text>
          {infoItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={[
                  styles.infoRow,
                  idx < infoItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                ]}
              >
                <View style={[styles.infoIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
                  <Icon size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text variant="caption" color="secondary">{item.label}</Text>
                  <Text variant="body" weight="medium">{item.value}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        <Button
          label="Sign Out"
          variant="emergency"
          size="lg"
          fullWidth
          onPress={handleLogout}
          leftIcon={<LogOut size={20} color="#FFFFFF" />}
          style={styles.logoutButton}
        />

        <Text variant="caption" color="tertiary" style={styles.versionText}>
          ResQDrive v0.1.0 · Batch 0.2
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    marginBottom: 4,
  },
  card: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  logoutButton: {
    marginBottom: 16,
  },
  versionText: {
    textAlign: 'center',
  },
});