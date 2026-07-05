import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Text, Button, Input } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { AuthScreenProps } from '@nav/types';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const theme = useAppTheme();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    const { user, error } = await authService.signIn({ email: email.trim(), password });
    setSubmitting(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    if (user) setUser(user);
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <Text variant="heading" weight="bold" color="onPrimary">R</Text>
            </View>
            <Text variant="heading" weight="bold" style={styles.title}>Welcome back</Text>
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
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              leftIcon={<Mail size={20} color={theme.colors.textTertiary} />}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon={<Lock size={20} color={theme.colors.textTertiary} />}
              rightIcon={
                showPassword
                  ? <EyeOff size={20} color={theme.colors.textTertiary} />
                  : <Eye size={20} color={theme.colors.textTertiary} />
              }
              onRightIconPress={() => setShowPassword((v) => !v)}
            />

            {errors.general ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.emergencySoft }]}>
                <Text variant="caption" color="emergency">{errors.general}</Text>
              </View>
            ) : null}

            <Button
              label={submitting ? 'Signing in...' : 'Sign In'}
              fullWidth
              size="lg"
              onPress={handleSignIn}
              loading={submitting}
              disabled={submitting}
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
      </KeyboardAvoidingView>
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
  errorBanner: {
    padding: 12,
    borderRadius: 10,
  },
});