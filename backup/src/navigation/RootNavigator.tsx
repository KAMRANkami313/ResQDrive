import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { useAppTheme } from '@theme/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useAppTheme();
  const isAuthenticated = false;

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.emergency,
        },
        fonts: {
          regular: { fontFamily: theme.typography.fontFamily.regular, fontWeight: '400' as const },
          medium: { fontFamily: theme.typography.fontFamily.medium, fontWeight: '500' as const },
          bold: { fontFamily: theme.typography.fontFamily.bold, fontWeight: '700' as const },
          heavy: { fontFamily: theme.typography.fontFamily.bold, fontWeight: '800' as const },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}