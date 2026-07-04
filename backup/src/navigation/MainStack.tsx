import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { HomeScreen } from '@screens/home/HomeScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { useAppTheme } from '@theme/ThemeContext';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeight.semibold,
          fontSize: theme.typography.fontSize.lg,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'ResQDrive' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="Vehicles"
        component={ProfileScreen}
        options={{ title: 'My Vehicles' }}
      />
      <Stack.Screen
        name="Contacts"
        component={ProfileScreen}
        options={{ title: 'Emergency Contacts' }}
      />
      <Stack.Screen
        name="IncidentHistory"
        component={ProfileScreen}
        options={{ title: 'Incident History' }}
      />
      <Stack.Screen
        name="Settings"
        component={ProfileScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}