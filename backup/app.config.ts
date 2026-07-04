import { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => ({
  ...config,
  name: 'ResQDrive',
  slug: 'resqdrive',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F4C81',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.resqdrive.app',
    infoPlist: {
      NSMicrophoneUsageDescription: 'ResQDrive uses the microphone to detect crash sounds during driving mode.',
      NSCameraUsageDescription: 'ResQDrive uses the camera to assess vehicle damage after an accident.',
      NSLocationWhenInUseUsageDescription: 'ResQDrive uses location for accident detection and emergency response.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'ResQDrive uses background location for continuous accident monitoring while driving.',
      NSContactsUsageDescription: 'ResQDrive accesses contacts to notify your emergency contacts in case of an accident.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#0F4C81',
    },
    package: 'com.resqdrive.app',
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.VIBRATE',
      'android.permission.CALL_PHONE',
      'android.permission.SEND_SMS',
      'android.permission.READ_CONTACTS',
    ],
  },
  extra: {
    eas: {
      projectId: '',
    },
  },
});