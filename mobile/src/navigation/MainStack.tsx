import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainStackParamList } from './types';
import { HomeScreen } from '@screens/home/HomeScreen';
import { ProfileScreen } from '@screens/profile/ProfileScreen';
import { VehiclesScreen } from '@screens/vehicle/VehiclesScreen';
import { ContactsScreen } from '@screens/contacts/ContactsScreen';
import { IncidentHistoryScreen } from '@screens/incident/IncidentHistoryScreen';
import { useAppTheme } from '@theme/ThemeContext';
import { Home, Car, Phone, FileText, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainStackParamList>();

export function MainStack() {
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