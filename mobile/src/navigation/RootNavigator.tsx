import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { useAppTheme } from '@theme/ThemeContext';
import { useAuth } from '@hooks/useAuth';
import { Spinner } from '@components/ui';
import { CountdownOverlay } from '@components/CountdownOverlay';
import { SeverityAssessment } from '@services/severity';
import { Alert } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useAppTheme();
  const { isAuthenticated, isInitialized } = useAuth();

  const handleCountdownComplete = (assessment: SeverityAssessment) => {
    Alert.alert(
      'Alerts Dispatched (Demo)',
      `Severity: ${assessment.level.toUpperCase()}\nScore: ${(assessment.score * 100).toFixed(1)}%\n\nIn Batch 3.1, this will trigger multi-channel alert dispatch (push + SMS + email).`,
    );
  };

  const handleCountdownCancel = (reason: string) => {
    console.log('[countdown] cancelled:', reason);
  };

  if (!isInitialized) {
    return <Spinner fullScreen />;
  }

  return (
    <NavigationContainer
      key={isAuthenticated ? 'main' : 'auth'}
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

      <CountdownOverlay
        onComplete={handleCountdownComplete}
        onCancel={handleCountdownCancel}
      />
    </NavigationContainer>
  );
}