import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Button, Input } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { AuthScreenProps } from '@nav/types';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const theme = useAppTheme();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
            <Text variant="heading" weight="bold" color="onPrimary">
              R
            </Text>
          </View>
          <Text variant="heading" weight="bold" style={styles.title}>
            Welcome back
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Sign in to keep your drive protected
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            autoComplete="password"
          />
          <Button
            label="Sign In"
            fullWidth
            size="lg"
            onPress={() => navigation.navigate('Register')}
            style={styles.signInButton}
          />
          <Button
            label="Forgot password?"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('ForgotPassword')}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color="secondary" style={styles.footerText}>
            Don't have an account?
          </Text>
          <Button
            label="Create account"
            variant="outline"
            size="md"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
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
  form: {
    gap: 16,
  },
  signInButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    textAlign: 'center',
  },
});