import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  Vehicles: undefined;
  Contacts: undefined;
  IncidentHistory: undefined;
  Settings: undefined;
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