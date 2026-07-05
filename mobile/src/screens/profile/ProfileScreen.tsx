import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button, Avatar } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { useAuth } from '@hooks/useAuth';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { confirmDialog } from '@utils/confirm';
import { ProfileScreenProps } from '@nav/types';
import { Mail, Phone, Shield, Droplet, AlertTriangle, IdCard, LogOut, ChevronRight, Settings, Lock, UserCog } from 'lucide-react-native';

export function ProfileScreen({ navigation }: ProfileScreenProps) {
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

  const accountItems = [
    { icon: Mail, label: 'Email', value: user?.email ?? '—' },
    { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
    { icon: IdCard, label: 'CNIC', value: user?.cnic || 'Not set' },
    { icon: Droplet, label: 'Blood Group', value: user?.blood_group || 'Not set' },
    { icon: AlertTriangle, label: 'Allergies', value: user?.allergies || 'None' },
  ];

  const settingsItems = [
    { icon: UserCog, label: 'Edit Profile', color: theme.colors.primary, onPress: () => navigation.navigate('EditProfile') },
    { icon: Lock, label: 'Change Password', color: theme.colors.warning, onPress: () => navigation.navigate('ChangePassword') },
    { icon: Settings, label: 'Account Settings', color: theme.colors.textSecondary, onPress: () => navigation.navigate('AccountSettings') },
  ];

  const roleColor = user?.role === 'admin' ? theme.colors.emergency : theme.colors.primary;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Avatar
            uri={user?.avatar_url}
            name={user?.full_name}
            size="xl"
            onPress={() => navigation.navigate('EditProfile')}
            showEditBadge
          />
          <Text variant="heading" weight="bold" style={styles.name}>
            {user?.full_name || 'ResQDrive User'}
          </Text>
          <Text variant="body" color="secondary">
            {user?.email}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <Shield size={12} color={roleColor} />
            <Text variant="label" weight="bold" style={{ color: roleColor, marginLeft: 4 }}>
              {(user?.role ?? 'driver').toUpperCase()}
            </Text>
          </View>
        </View>

        <Card padding="md" elevation="sm" style={styles.card}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            ACCOUNT DETAILS
          </Text>
          {accountItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={[
                  styles.infoRow,
                  idx < accountItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
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

        <Card padding="none" elevation="sm" style={styles.card}>
          {settingsItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={[
                  styles.settingsRow,
                  idx < settingsItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                ]}
              >
                <Button
                  label={item.label}
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={item.onPress}
                  leftIcon={<Icon size={20} color={item.color} />}
                  rightIcon={<ChevronRight size={20} color={theme.colors.textTertiary} />}
                  style={styles.settingsButton}
                />
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
          leftIcon={<LogOut size={20} color={theme.colors.textOnEmergency} />}
          style={styles.logoutButton}
        />

        <Text variant="caption" color="tertiary" style={styles.versionText}>
          ResQDrive v0.1.0 · Batch 1.1
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    marginTop: 16,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
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
  settingsRow: {
    paddingHorizontal: 4,
  },
  settingsButton: {
    justifyContent: 'flex-start',
  },
  logoutButton: {
    marginBottom: 16,
  },
  versionText: {
    textAlign: 'center',
  },
});