import { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({
  children,
  style,
  padding = 'md',
  elevation = 'sm',
}: CardProps) {
  const theme = useAppTheme();

  const padMap = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.lg,
    lg: theme.spacing.xl,
    xl: theme.spacing['2xl'],
  };

  const shadowMap = {
    none: {},
    sm: theme.shadows.sm,
    md: theme.shadows.md,
    lg: theme.shadows.lg,
    xl: theme.shadows.xl,
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: padMap[padding],
        },
        shadowMap[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});