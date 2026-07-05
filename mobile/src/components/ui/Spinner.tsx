import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';

interface SpinnerProps {
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function Spinner({ size = 'large', fullScreen = false }: SpinnerProps) {
  const theme = useAppTheme();

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size={size} color={theme.colors.primary} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={theme.colors.primary} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});