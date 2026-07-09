import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabParamList, MainStackParamList } from './types';
import { HomeScreen } from '@screens/home/HomeScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { VehiclesScreen } from '@screens/vehicle/VehiclesScreen';
import { ContactsScreen } from '@screens/contacts/ContactsScreen';
import { IncidentHistoryScreen } from '@screens/incident/IncidentHistoryScreen';
import { IoTDebugScreen } from '@screens/dev/IoTDebugScreen';
import { DetectionDebugScreen } from '@screens/dev/DetectionDebugScreen';
import { CrashSoundDebugScreen } from '@screens/dev/CrashSoundDebugScreen';
import { SeverityDebugScreen } from '@screens/dev/SeverityDebugScreen';
import { CountdownDebugScreen } from '@screens/dev/CountdownDebugScreen';
import { AlertDispatchDebugScreen } from '@screens/dev/AlertDispatchDebugScreen';
import { EscalationDebugScreen } from '@screens/dev/EscalationDebugScreen';
import { OfflineFallbackDebugScreen } from '@screens/dev/OfflineFallbackDebugScreen';
import { LocationShareDebugScreen } from '@screens/dev/LocationShareDebugScreen';
import { SosDebugScreen } from '@screens/dev/SosDebugScreen';
import { HospitalScreen } from '@screens/emergency/HospitalScreen';
import { EditProfileScreen } from '@screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '@screens/profile/ChangePasswordScreen';
import { AccountSettingsScreen } from '@screens/profile/AccountSettingsScreen';
import { AddVehicleScreen } from '@screens/vehicle/AddVehicleScreen';
import { VehicleDetailScreen } from '@screens/vehicle/VehicleDetailScreen';
import { AddContactScreen } from '@screens/contacts/AddContactScreen';
import { useAppTheme } from '@theme/ThemeContext';
import { Home, Car, Phone, FileText, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function TabNavigator() {
  const theme = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeight.semibold,
          fontSize: theme.typography.fontSize.lg,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: theme.typography.fontWeight.medium,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ResQDrive',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehiclesScreen}
        options={{
          title: 'My Vehicles',
          tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
          tabBarLabel: 'Vehicles',
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: 'Emergency Contacts',
          tabBarIcon: ({ color, size }) => <Phone size={size} color={color} />,
          tabBarLabel: 'Contacts',
        }}
      />
      <Tab.Screen
        name="IncidentHistory"
        component={IncidentHistoryScreen}
        options={{
          title: 'Incident History',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
          tabBarLabel: 'Incidents',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

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
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IoTDebug"
        component={IoTDebugScreen}
        options={{ title: 'IoT Debug Panel', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="DetectionDebug"
        component={DetectionDebugScreen}
        options={{ title: 'Detection Engine', headerBackTitle: 'Back' }}
      />
            <Stack.Screen
        name="CrashSoundDebug"
        component={CrashSoundDebugScreen}
        options={{ title: 'Crash Sound AI', headerBackTitle: 'Back' }}
      />
            <Stack.Screen
        name="SeverityDebug"
        component={SeverityDebugScreen}
        options={{ title: 'Severity Engine', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="CountdownDebug"
        component={CountdownDebugScreen}
        options={{ title: 'Countdown Engine', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AlertDispatchDebug"
        component={AlertDispatchDebugScreen}
        options={{ title: 'Alert Dispatch', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="EscalationDebug"
        component={EscalationDebugScreen}
        options={{ title: 'Escalation Engine', headerBackTitle: 'Back' }}
      />
      
      <Stack.Screen
        name="OfflineFallbackDebug"
        component={OfflineFallbackDebugScreen}
        options={{ title: 'Offline Fallback', headerBackTitle: 'Back' }}
      />  

      <Stack.Screen
        name="LocationShareDebug"
        component={LocationShareDebugScreen}
        options={{ title: 'Location Share', headerBackTitle: 'Back' }}
      />
      
      <Stack.Screen
        name="SosDebug"
        component={SosDebugScreen}
        options={{ title: 'SOS Engine', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="Hospital"
        component={HospitalScreen}
        options={{ title: 'Nearest Hospitals', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ title: 'Account Settings', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AddVehicle"
        component={AddVehicleScreen}
        options={({ route }) => ({
          title: route.params?.vehicleId ? 'Edit Vehicle' : 'Add Vehicle',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ title: 'Vehicle Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="AddContact"
        component={AddContactScreen}
        options={({ route }) => ({
          title: route.params?.contactId ? 'Edit Contact' : 'Add Contact',
          headerBackTitle: 'Back',
        })}
      />
    </Stack.Navigator>
  );
}