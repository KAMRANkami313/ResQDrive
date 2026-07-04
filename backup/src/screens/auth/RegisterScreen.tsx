import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen, Text, Button, Input } from '@components/ui';
import { AuthScreenProps } from '@nav/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="heading" weight="bold" style={styles.title}>
            Create account
          </Text>
          <Text variant="body" color="secondary">
            Join ResQDrive to stay safe on every trip
          </Text>
        </View>

        <View style={styles.form}>
          <Input label="Full Name" placeholder="John Doe" />
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Phone Number"
            placeholder="+92 300 1234567"
            keyboardType="phone-pad"
          />
          <Input label="Password" placeholder="Create a strong password" secureTextEntry />
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            secureTextEntry
          />
          <Button label="Create Account" fullWidth size="lg" style={styles.submit} />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color="secondary">
            Already have an account?
          </Text>
          <Button
            label="Sign in"
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
  submit: {
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
});