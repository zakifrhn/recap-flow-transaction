/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';
import App from './App';
import { name as appName } from './app.json';
import notificationHeadlessTask from './src/modules/notification/headless';

AppRegistry.registerHeadlessTask(
  RNAndroidNotificationListenerHeadlessJsName,
  () => notificationHeadlessTask,
);

AppRegistry.registerComponent(appName, () => App);
