import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Screen, Text, Button, Input, Card } from '@components/ui';
import { useAppTheme } from '@theme/ThemeContext';
import { ChangePasswordScreenProps } from '@nav/types';
import { profileService } from '@services/profile.service';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';

export function ChangePasswordScreen(_props: ChangePasswordScreenProps) {
  const theme = useAppTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const eyeColor = theme.colors.textTertiary;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = 'Current password is required';
    if (!newPassword) next.newPassword = 'New password is required';
    else if (newPassword.length < 6) next.newPassword = 'Password must be at least 6 characters';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (currentPassword && newPassword === currentPassword) {
      next.newPassword = 'New password must be different from current';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    const { error } = await profileService.changePassword({
      currentPassword,
      newPassword,
    });
    setSubmitting(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => _props.navigation.goBack(), 1500);
  };

  if (success) {
    return (
      <Screen>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.successSoft }]}>
            <CheckCircle size={64} color={theme.colors.success} />
          </View>
          <Text variant="heading" weight="bold" style={styles.successTitle}>
            Password Changed
          </Text>
          <Text variant="body" color="secondary" style={styles.successText}>
            Your password has been updated successfully.
          </Text>
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
          <Card padding="md" elevation="sm" style={styles.hintCard}>
            <Lock size={20} color={theme.colors.primary} />
            <Text variant="body" color="secondary" style={styles.hintText}>
              For security, please verify your current password before setting a new one.
            </Text>
          </Card>

          <View style={styles.form}>
            <Input
              label="Current Password"
              placeholder="Enter current password"
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              error={errors.currentPassword}
              leftIcon={<Lock size={20} color={eyeColor} />}
              rightIcon={
                showCurrent
                  ? <EyeOff size={20} color={eyeColor} />
                  : <Eye size={20} color={eyeColor} />
              }
              onRightIconPress={() => setShowCurrent((v) => !v)}
            />
            <Input
              label="New Password"
              placeholder="Enter new password"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
              error={errors.newPassword}
              leftIcon={<Lock size={20} color={eyeColor} />}
              rightIcon={
                showNew
                  ? <EyeOff size={20} color={eyeColor} />
                  : <Eye size={20} color={eyeColor} />
              }
              onRightIconPress={() => setShowNew((v) => !v)}
              hint="Minimum 6 characters"
            />
            <Input
              label="Confirm New Password"
              placeholder="Re-enter new password"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              leftIcon={<Lock size={20} color={eyeColor} />}
              rightIcon={
                showConfirm
                  ? <EyeOff size={20} color={eyeColor} />
                  : <Eye size={20} color={eyeColor} />
              }
              onRightIconPress={() => setShowConfirm((v) => !v)}
            />

            {errors.general ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.emergencySoft }]}>
                <Text variant="caption" color="emergency">{errors.general}</Text>
              </View>
            ) : null}

            <Button
              label={submitting ? 'Updating...' : 'Update Password'}
              fullWidth
              size="lg"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  hintText: {
    flex: 1,
  },
  form: {
    gap: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
  },
  submitButton: {
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    marginBottom: 8,
  },
  successText: {
    textAlign: 'center',
  },
});