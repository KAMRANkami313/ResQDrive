import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Button, Input } from '@components/ui';
import { AuthScreenProps } from '@nav/types';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="heading" weight="bold" style={styles.title}>
            Reset password
          </Text>
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
          />
          <Button label="Send Reset Link" fullWidth size="lg" />
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
});