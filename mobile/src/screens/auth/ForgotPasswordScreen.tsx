import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Text, Button, Input } from '@components/ui';
import { AuthScreenProps } from '@nav/types';
import { authService } from '@services/auth.service';
import { Mail, CheckCircle } from 'lucide-react-native';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    setSubmitting(true);
    setError(undefined);
    const { error: err } = await authService.resetPassword(email.trim());
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#2A9D8F" />
          </View>
          <Text variant="heading" weight="bold" style={styles.successTitle}>
            Check your inbox
          </Text>
          <Text variant="body" color="secondary" style={styles.successText}>
            We've sent a password reset link to {email}. Follow the link in the email to reset your password.
          </Text>
          <Button
            label="Back to login"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Login')}
            style={styles.successButton}
          />
        </View>
      </Screen>
    );
  }

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
            <Text variant="heading" weight="bold" style={styles.title}>Reset password</Text>
            <Text variant="body" color="secondary">
              Enter your email and we'll send you a reset link
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={error}
              leftIcon={<Mail size={20} color="#9CA3AF" />}
            />
            <Button
              label={submitting ? 'Sending...' : 'Send Reset Link'}
              fullWidth
              size="lg"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
            />
          </View>

          <View style={styles.footer}>
            <Button
              label="Back to login"
              variant="ghost"
              size="sm"
              onPress={() => navigation.navigate('Login')}
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
    marginBottom: 32,
  },
  title: {
    marginBottom: 4,
  },
  form: {
    gap: 16,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 32,
  },
  successButton: {
    width: '100%',
  },
});