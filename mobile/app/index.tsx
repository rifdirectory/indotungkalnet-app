import React, { useState, useEffect } from 'react';
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
import { API_URL } from '../services/api';
import axios from 'axios';
import { useUser } from '../context/UserContext';

// Konfigurasi API - Sekarang diambil dari services/api.js

export default function LoginScreen() {
  const router = useRouter();
  const { user, loading: contextLoading, login: contextLogin } = useUser();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!contextLoading && user) {
        // Beri sedikit jeda agar router web siap
        setTimeout(() => {
          router.replace('/(drawer)/home');
        }, 100);
    }
  }, [user, contextLoading]);

  if (contextLoading) {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#2563eb" />
        </View>
    );
  }

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
        // Simpan data user ke Context
        const { full_name, position, id, is_pic, role } = response.data.data;
        
        await contextLogin({
          name: full_name || '',
          position: position || '',
          id: String(id),
          isPic: !!is_pic,
          role: role || 'employee',
          token: response.data.token || '',
        });
        
        router.replace('/(drawer)/home');
      } else {
        Alert.alert('Gagal', response.data.message);
      }
    } catch (error: any) {
      console.log('Login error:', error);
      // Determine error source (Axios network error vs JS runtime error)
      const msg = error.response?.data?.message || error.message || 'Gagal terhubung ke server';
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
            <View className={`flex-row items-center border rounded-2xl px-4 py-3 transition-all ${focusedField === 'id' ? 'bg-white border-blue-500 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
              <User size={20} color={focusedField === 'id' ? "#2563eb" : "#9ca3af"} style={{ marginRight: 12 }} />
              <TextInput 
                placeholder={focusedField === 'id' ? "" : "001-2026-ITN"}
                placeholderTextColor="#94a3af"
                onFocus={() => setFocusedField('id')}
                onBlur={() => setFocusedField(null)}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                spellCheck={false}
                className="flex-1 text-gray-800 font-medium border-0 outline-none p-0 bg-transparent"
                value={employeeCode}
                onChangeText={setEmployeeCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-gray-600 mb-2 font-medium ml-1">Kata Sandi</Text>
            <View className={`flex-row items-center border rounded-2xl px-4 py-3 transition-all ${focusedField === 'pass' ? 'bg-white border-blue-500 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
              <Lock size={20} color={focusedField === 'pass' ? "#2563eb" : "#9ca3af"} style={{ marginRight: 12 }} />
              <TextInput 
                placeholder={focusedField === 'pass' ? "" : "Masukkan kata sandi"}
                placeholderTextColor="#94a3af"
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                spellCheck={false}
                autoCapitalize="none"
                className="flex-1 text-gray-800 font-medium border-0 outline-none p-0 bg-transparent"
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
