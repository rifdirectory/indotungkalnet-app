import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { API_URL } from './api';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    try {
        // Get the token from Expo push service
        // The projectId is now mandatory for Expo SDK 48+
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId || projectId === 'YOUR-EXPO-PROJECT-ID-HERE') {
            console.warn('[Notifications] Missing valid projectId in app.json. Push notifications might not work.');
        }

        token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        })).data;
        console.log('[Notifications] Expo Push Token:', token);
        
        // Save to backend if we have a logged in user
        const userId = await SecureStore.getItemAsync('user_id');
        if (userId && token) {
            await axios.post(`${API_URL}/employees/push-token`, {
                employee_id: userId,
                push_token: token
            });
            console.log('[Notifications] Token registered with backend');
        }
    } catch (e) {
        console.error('[Notifications] Error getting/sending token:', e);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}
