import { ReactNode } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';

export type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'label' | 'caption' | 'overline';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'onPrimary' | 'onEmergency' | 'emergency' | 'success' | 'warning' | 'brand';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  children: ReactNode;
}

const variantFontSize: Record<TextVariant, number> = {
  display: 44,
  heading: 30,
  title: 20,
  body: 15,
  label: 13,
  caption: 11,
  overline: 11,
};

const variantLineHeight: Record<TextVariant, number> = {
  display: 52,
  heading: 38,
  title: 28,
  body: 22,
  label: 18,
  caption: 16,
  overline: 16,
};

export function Text({
  variant = 'body',
  weight = 'regular',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useAppTheme();

  const colorMap: Record<TextColor, string> = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    tertiary: theme.colors.textTertiary,
    onPrimary: theme.colors.textOnPrimary,
    onEmergency: theme.colors.textOnEmergency,
    emergency: theme.colors.emergency,
    success: theme.colors.success,
    warning: theme.colors.warning,
    brand: theme.colors.primary,
  };

  const textStyle: TextStyle = {
    fontSize: variantFontSize[variant],
    lineHeight: variantLineHeight[variant],
    fontWeight: theme.typography.fontWeight[weight],
    color: colorMap[color],
    textAlign: align,
    letterSpacing: variant === 'overline' ? 1.2 : variant === 'label' ? 0.1 : 0,
    textTransform: variant === 'overline' ? 'uppercase' : 'none',
  };

  return <RNText style={[textStyle, style]} {...rest}>{children}</RNText>;
}