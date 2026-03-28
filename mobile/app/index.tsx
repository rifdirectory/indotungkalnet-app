import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Fingerprint, Smartphone, User, Lock } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// Konfigurasi API
const API_URL = 'http://192.168.1.7:3000/api';

export default function LoginScreen() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeCode || !password) {
      Alert.alert('Eror', 'Silakan isi ID Pegawai dan Kata Sandi');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/employee/login`, {
        employee_code: employeeCode,
        password: password
      });

      if (response.data.success) {
        // Simpan data user ke SecureStore
        const { full_name, position, id } = response.data.data;
        await SecureStore.setItemAsync('user_name', full_name);
        await SecureStore.setItemAsync('user_position', position);
        await SecureStore.setItemAsync('user_id', id.toString());
        
        router.push('/home');
      } else {
        Alert.alert('Gagal', response.data.message);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal terhubung ke server';
      Alert.alert('Eror Login', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-8 pt-20 justify-center">
        {/* Header/Logo Section */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center shadow-lg mb-4">
            <Lock size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-800">ITNET MOBILE</Text>
          <Text className="text-gray-500 mt-1">Akses Teknisi & Staff</Text>
        </View>

        {/* Form Section */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-600 mb-2 font-medium ml-1">ID Pegawai</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <User size={20} color="#9ca3af" style={{ marginRight: 12 }} />
              <TextInput 
                placeholder="001-2026-ITN"
                className="flex-1 text-gray-800 font-medium"
                value={employeeCode}
                onChangeText={setEmployeeCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-gray-600 mb-2 font-medium ml-1">Kata Sandi</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <Lock size={20} color="#9ca3af" style={{ marginRight: 12 }} />
              <TextInput 
                placeholder="Masukkan kata sandi"
                className="flex-1 text-gray-800 font-medium"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={loading}
            style={{ marginTop: 32 }}
            className={`py-4 rounded-2xl flex-row justify-center items-center shadow-md ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-lg font-bold">Masuk Sekarang</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-auto mb-10 items-center">
          <Text className="text-gray-400 text-xs">v1.0.0 © 2026 PT. Indo Tungkal Net</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
