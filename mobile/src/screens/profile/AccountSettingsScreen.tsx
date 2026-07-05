import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Card, Button } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { useAuth } from '@hooks/useAuth';
import { AccountSettingsScreenProps } from '@nav/types';
import { Mail, Shield, Calendar, User, Info, ChevronRight } from 'lucide-react-native';

export function AccountSettingsScreen(_props: AccountSettingsScreenProps) {
  const theme = useAppTheme();
  const { user } = useAuth();

  const accountInfo = [
    { icon: User, label: 'User ID', value: user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : '—' },
    { icon: Mail, label: 'Email', value: user?.email ?? '—' },
    { icon: Shield, label: 'Role', value: (user?.role ?? 'driver').toUpperCase() },
    { icon: Calendar, label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
    { icon: Shield, label: 'Account Status', value: user?.is_active ? 'Active' : 'Inactive' },
  ];

  const roleDescriptions: Record<string, string> = {
    driver: 'As a driver, you can register vehicles, add emergency contacts, and use accident detection features.',
    admin: 'As an admin, you have access to the admin dashboard with user management, analytics, and system health monitoring.',
    emergency_staff: 'As emergency staff, you receive accident alerts and can view victim locations for rescue coordination.',
    mechanic: 'As a workshop owner, you can list your workshop, receive repair requests, and manage service bookings.',
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card padding="md" elevation="sm" style={styles.card}>
          <Text variant="label" color="secondary" style={styles.sectionTitle}>
            ACCOUNT INFORMATION
          </Text>
          {accountInfo.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={[
                  styles.infoRow,
                  idx < accountInfo.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
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

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.roleHeader}>
            <Shield size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.roleTitle}>
              Your Role: {(user?.role ?? 'driver').toUpperCase()}
            </Text>
          </View>
          <Text variant="body" color="secondary">
            {roleDescriptions[user?.role ?? 'driver']}
          </Text>
          {user?.role === 'driver' ? (
            <Text variant="caption" color="tertiary" style={styles.roleNote}>
              To upgrade to a workshop owner account, contact an administrator after the workshop module is available.
            </Text>
          ) : null}
        </Card>

        <Card padding="md" elevation="sm" style={styles.card}>
          <View style={styles.roleHeader}>
            <Info size={20} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" style={styles.roleTitle}>
              App Information
            </Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text variant="body" color="secondary">Version</Text>
            <Text variant="body" weight="medium">0.1.0</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text variant="body" color="secondary">Build</Text>
            <Text variant="body" weight="medium">Batch 1.1</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text variant="body" color="secondary">Platform</Text>
            <Text variant="body" weight="medium">Expo SDK 54</Text>
          </View>
        </Card>

        <Button
          label="Privacy & Data Policy"
          variant="ghost"
          size="md"
          fullWidth
          rightIcon={<ChevronRight size={20} color={theme.colors.textTertiary} />}
          style={styles.linkButton}
        />
        <Button
          label="Terms of Service"
          variant="ghost"
          size="md"
          fullWidth
          rightIcon={<ChevronRight size={20} color={theme.colors.textTertiary} />}
          style={styles.linkButton}
        />
        <Button
          label="Help & Support"
          variant="ghost"
          size="md"
          fullWidth
          rightIcon={<ChevronRight size={20} color={theme.colors.textTertiary} />}
          style={styles.linkButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleTitle: {
    marginLeft: 8,
  },
  roleNote: {
    marginTop: 12,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  linkButton: {
    marginBottom: 4,
  },
});