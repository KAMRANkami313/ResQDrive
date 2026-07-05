import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Vehicles: undefined;
  Contacts: undefined;
  IncidentHistory: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  IoTDebug: undefined;
  DetectionDebug: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  AccountSettings: undefined;
  AddVehicle: { vehicleId?: string };
  VehicleDetail: { vehicleId: string };
  AddContact: { contactId?: string };
};

export type RootStackParamList = {
  Auth: AuthStackParamList;
  Main: MainStackParamList;
};

export type AuthScreenProps<Screen extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  Screen
>;

export type TabScreenProps<Screen extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  Screen
>;

export type MainStackScreenProps<Screen extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  Screen
>;

export type TabScreenWithStackProps<Screen extends keyof TabParamList> = CompositeScreenProps<
  TabScreenProps<Screen>,
  MainStackScreenProps<'MainTabs'>
>;

export type HomeScreenProps = TabScreenWithStackProps<'Home'>;
export type ProfileScreenProps = TabScreenWithStackProps<'Profile'>;
export type VehiclesScreenProps = TabScreenWithStackProps<'Vehicles'>;
export type ContactsScreenProps = TabScreenWithStackProps<'Contacts'>;
export type IoTDebugScreenProps = MainStackScreenProps<'IoTDebug'>;
export type DetectionDebugScreenProps = MainStackScreenProps<'DetectionDebug'>;
export type EditProfileScreenProps = MainStackScreenProps<'EditProfile'>;
export type ChangePasswordScreenProps = MainStackScreenProps<'ChangePassword'>;
export type AccountSettingsScreenProps = MainStackScreenProps<'AccountSettings'>;
export type AddVehicleScreenProps = MainStackScreenProps<'AddVehicle'>;
export type VehicleDetailScreenProps = MainStackScreenProps<'VehicleDetail'>;
export type AddContactScreenProps = MainStackScreenProps<'AddContact'>;