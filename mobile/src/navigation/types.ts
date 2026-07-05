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

export type MainStackParamList = TabParamList & {
  IoTDebug: undefined;
};

export type RootStackParamList = {
  Auth: AuthStackParamList;
  Main: MainStackParamList;
};

export type AuthScreenProps<Screen extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  Screen
>;

export type MainScreenProps<Screen extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  Screen
>;

export type TabScreenProps<Screen extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  Screen
>;