import { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@theme/ThemeContext';
import { Text } from './Text';
import { Camera } from 'lucide-react-native';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  onPress?: () => void;
  showEditBadge?: boolean;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 80,
  xl: 120,
};

const fontSizeMap: Record<AvatarSize, 'label' | 'body' | 'title' | 'heading'> = {
  sm: 'label',
  md: 'body',
  lg: 'title',
  xl: 'heading',
};

export function Avatar({ uri, name, size = 'md', onPress, showEditBadge = false }: AvatarProps) {
  const theme = useAppTheme();
  const [imageError, setImageError] = useState(false);
  const dimension = sizeMap[size];
  const showImage = uri && !imageError;
  const initials = (name?.trim()?.charAt(0) || '?').toUpperCase();

  const content = (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: theme.colors.primarySoft,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={styles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.fallback}>
          <Text variant={fontSizeMap[size]} weight="bold" color="brand">
            {initials}
          </Text>
        </View>
      )}
      {showEditBadge ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.primary,
              width: dimension * 0.32,
              height: dimension * 0.32,
              borderRadius: (dimension * 0.32) / 2,
            },
          ]}
        >
          <Camera size={dimension * 0.16} color={theme.colors.textOnPrimary} />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});