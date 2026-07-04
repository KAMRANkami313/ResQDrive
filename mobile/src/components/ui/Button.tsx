import { ReactNode } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  StyleSheet,
  View,
} from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { Text, TextVariant, TextWeight } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'emergency' | 'success' | 'warning' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonTextStyle {
  variant: TextVariant;
  weight: TextWeight;
}

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const theme = useAppTheme();

  const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: ButtonTextStyle; iconSize: number }> = {
    sm: {
      container: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, minHeight: 36 },
      text: { variant: 'label', weight: 'medium' },
      iconSize: 16,
    },
    md: {
      container: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.xl, minHeight: 44 },
      text: { variant: 'body', weight: 'medium' },
      iconSize: 20,
    },
    lg: {
      container: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing['2xl'], minHeight: 52 },
      text: { variant: 'title', weight: 'semibold' },
      iconSize: 22,
    },
    xl: {
      container: { paddingVertical: theme.spacing.xl, paddingHorizontal: theme.spacing['3xl'], minHeight: 60 },
      text: { variant: 'title', weight: 'bold' },
      iconSize: 24,
    },
  };

  const getVariantStyle = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: theme.colors.primary, text: theme.colors.textOnPrimary };
      case 'secondary':
        return { bg: theme.colors.surfaceAlt, text: theme.colors.textPrimary };
      case 'emergency':
        return { bg: theme.colors.emergency, text: theme.colors.textOnEmergency };
      case 'success':
        return { bg: theme.colors.success, text: theme.colors.textOnPrimary };
      case 'warning':
        return { bg: theme.colors.warning, text: theme.colors.textPrimary };
      case 'outline':
        return { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary };
      case 'ghost':
        return { bg: 'transparent', text: theme.colors.primary };
    }
  };

  const v = getVariantStyle();
  const s = sizeStyles[size];

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        s.container,
        { backgroundColor: v.bg, opacity: isDisabled ? 0.5 : 1 },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        fullWidth ? { width: '100%' } : null,
        theme.shadows.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <Text
            variant={s.text.variant}
            weight={s.text.weight}
            style={{ color: v.text, textAlign: 'center' }}
          >
            {label}
          </Text>
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});