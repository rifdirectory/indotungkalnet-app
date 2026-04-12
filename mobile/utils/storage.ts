import * as ExpoSecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const setItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage error:', e);
    }
  } else {
    await ExpoSecureStore.setItemAsync(key, value);
  }
};

export const getItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage error:', e);
      return null;
    }
  } else {
    return await ExpoSecureStore.getItemAsync(key);
  }
};

export const deleteItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage error:', e);
    }
  } else {
    await ExpoSecureStore.deleteItemAsync(key);
  }
};

export default {
  setItemAsync,
  getItemAsync,
  deleteItemAsync
};
