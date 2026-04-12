import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Deteksi IP laptop secara otomatis
const hostUri = Constants.expoConfig?.hostUri;
const host = hostUri ? hostUri.split(':')[0] : '192.168.1.7';

// Alamat API Backend
// Android Emulator menggunakan 10.0.2.2 untuk akses localhost komputer host
let finalIP = host;
if (Platform.OS === 'android') {
    finalIP = '10.0.2.2';
} else if (Platform.OS === 'web') {
    finalIP = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
}

const API_URL = `http://${finalIP}:3000/api`;
console.log('Mobile API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { API_URL };
export default api;
