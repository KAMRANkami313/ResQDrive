import { ReactNode } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  ...rest
}: InputProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" weight="medium" color="primary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.inputBg,
            borderColor: error ? theme.colors.emergency : theme.colors.inputBorder,
            borderWidth: 1.5,
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.input,
            { color: theme.colors.textPrimary, fontSize: theme.typography.fontSize.md },
            leftIcon ? { marginLeft: 0 } : null,
            inputStyle,
          ]}
          {...rest}
        />
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="emergency" style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="secondary" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
    padding: 4,
  },
  message: {
    marginTop: 6,
  },
});