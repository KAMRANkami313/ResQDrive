import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Text, Button, Input } from '@components/ui';
import { AuthScreenProps } from '@nav/types';
import { authService } from '@services/auth.service';
import { useAuthStore } from '@stores/auth.store';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react-native';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const setUser = useAuthStore((s) => s.setUser);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Full name is required';
    else if (fullName.trim().length < 3) next.fullName = 'Name must be at least 3 characters';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!phone.trim()) next.phone = 'Phone number is required';
    else if (!/^\+?[\d\s-]{10,15}$/.test(phone)) next.phone = 'Enter a valid phone number';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    const { user, error } = await authService.signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    setSubmitting(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    if (user) setUser(user);
  };

  const inputIconColor = '#9CA3AF';

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
            <Text variant="heading" weight="bold" style={styles.title}>Create account</Text>
            <Text variant="body" color="secondary">
              Join ResQDrive to stay safe on every trip
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              leftIcon={<User size={20} color={inputIconColor} />}
            />
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              leftIcon={<Mail size={20} color={inputIconColor} />}
            />
            <Input
              label="Phone Number"
              placeholder="+92 300 1234567"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              leftIcon={<Phone size={20} color={inputIconColor} />}
            />
            <Input
              label="Password"
              placeholder="Create a strong password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon={<Lock size={20} color={inputIconColor} />}
              rightIcon={
                showPassword
                  ? <EyeOff size={20} color={inputIconColor} />
                  : <Eye size={20} color={inputIconColor} />
              }
              onRightIconPress={() => setShowPassword((v) => !v)}
            />
            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              leftIcon={<Lock size={20} color={inputIconColor} />}
            />

            {errors.general ? (
              <View style={styles.errorBanner}>
                <Text variant="caption" color="emergency">{errors.general}</Text>
              </View>
            ) : null}

            <Button
              label={submitting ? 'Creating account...' : 'Create Account'}
              fullWidth
              size="lg"
              onPress={handleRegister}
              loading={submitting}
              disabled={submitting}
              style={styles.submit}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color="secondary">Already have an account?</Text>
            <Button
              label="Sign in"
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
  submit: {
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: '#FDECEE',
    padding: 12,
    borderRadius: 10,
  },
});