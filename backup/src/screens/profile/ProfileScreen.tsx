import { View, StyleSheet } from 'react-native';
import { Screen, Text } from '@components/ui';

export function ProfileScreen() {
  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <Text variant="heading" weight="bold">
          Profile
        </Text>
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Profile management will be implemented in Batch 1.1
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
  },
});