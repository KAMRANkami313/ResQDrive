import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { Text } from './Text';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'emergency' | 'outline';
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}: EmptyStateProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
        {icon}
      </View>
      <Text variant="title" weight="semibold" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color="secondary" style={styles.message}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant={actionVariant}
          size="md"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
  },
  action: {
    minWidth: 180,
  },
});