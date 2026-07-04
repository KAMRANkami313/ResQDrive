import { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@theme/ThemeContext';

interface ScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  backgroundColor?: string;
}

export function Screen({
  children,
  style,
  safeArea = true,
  backgroundColor,
}: ScreenProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: backgroundColor || theme.colors.background,
          paddingTop: safeArea ? insets.top : 0,
          paddingBottom: safeArea ? insets.bottom : 0,
          paddingLeft: safeArea ? insets.left : 0,
          paddingRight: safeArea ? insets.right : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});