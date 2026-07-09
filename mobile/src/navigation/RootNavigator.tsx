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
import { alertDispatchService, buildAlertPayload } from '@services/alert';
import { escalationService } from '@services/escalation';
import { locationShareService } from '@services/location-share';
import { showAlert } from '@utils/alert';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useAppTheme();
  const { isAuthenticated, isInitialized } = useAuth();

  const handleCountdownComplete = async (assessment: SeverityAssessment) => {
    try {
      const payload = await buildAlertPayload(assessment, null);
      const result = await alertDispatchService.dispatch(payload);

      const channelSummary = result.channels
        .map((c) => `${c.channel}: ${c.status}`)
        .join('\n');

      showAlert(
        'Alerts Dispatched',
        `Severity: ${assessment.level.toUpperCase()}\nScore: ${(assessment.score * 100).toFixed(1)}%\nOverall: ${result.overallStatus.toUpperCase()}\nIncident: ${result.incidentId.slice(0, 8)}...\n\n${channelSummary}\n\nEscalating to emergency contacts & starting live location share...`,
      );

      escalationService.start({
        incidentId: result.incidentId,
        severity: assessment,
        sensorSnapshot: payload.sensorSnapshot,
        userName: payload.userName,
        userPhone: payload.userPhone,
        mapsLink: payload.mapsLink,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });

      if (assessment.level === 'moderate' || assessment.level === 'severe') {
        locationShareService.start(result.incidentId).catch((err) => {
          console.warn('[countdown] location share failed to start:', err);
        });
      }
    } catch (err) {
      console.error('[countdown] dispatch failed:', err);
      showAlert(
        'Dispatch Failed',
        `Could not dispatch alerts: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleCountdownCancel = (reason: string) => {
    console.log('[countdown] cancelled:', reason);
    if (escalationService.getState().status === 'running') {
      escalationService.cancel(reason);
    }
    if (locationShareService.getState().isActive) {
      locationShareService.stop(`countdown_cancelled: ${reason}`);
    }
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