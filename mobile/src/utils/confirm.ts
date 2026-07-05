import { Alert, Platform } from 'react-native';

export function confirmDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}