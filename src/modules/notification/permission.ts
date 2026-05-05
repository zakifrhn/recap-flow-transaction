import RNAndroidNotificationListener from 'react-native-android-notification-listener';

export async function checkPermission(): Promise<boolean> {
  const status = await RNAndroidNotificationListener.getPermissionStatus();
  return status === 'authorized';
}

export function requestPermission(): void {
  RNAndroidNotificationListener.requestPermission();
}
