import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Calendar, 
  FileText, 
  CheckCircle2,
  Clock
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = 'http://192.168.1.7:3000/api';

export default function LeaveScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'izin',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    SecureStore.getItemAsync('user_id').then(id => setUserId(id));
  }, []);

  const handleSubmit = async () => {
    if (!formData.reason) {
      Alert.alert('Gagal', 'Silakan isi alasan izin Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/presence/leave`, {
        employee_id: userId,
        type: formData.type,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason
      });

      if (res.data.success) {
        Alert.alert('Berhasil', 'Permohonan izin Anda telah dikirim ke PIC.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Leave Error:', error);
      Alert.alert('Error', 'Gagal mengirim permohonan. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Ajukan Izin / Cuti</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-xs">JENIS PERMOHONAN</Text>
        <View className="flex-row space-x-3 mb-8">
            {['izin', 'sakit', 'cuti'].map((t) => (
                <TouchableOpacity 
                    key={t}
                    onPress={() => setFormData({ ...formData, type: t })}
                    className={`flex-1 p-4 rounded-2xl border items-center ${formData.type === t ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                >
                    <Text className={`font-bold capitalize ${formData.type === t ? 'text-blue-500' : 'text-gray-500'}`}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <Text className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-xs">TANGGAL</Text>
        <View className="flex-row space-x-4 mb-8">
            <View className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">DARI</Text>
                <TextInput 
                    value={formData.startDate}
                    onChangeText={(t) => setFormData({ ...formData, startDate: t })}
                    placeholder="YYYY-MM-DD"
                    className="font-bold text-gray-800"
                />
            </View>
            <View className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">SAMPAI</Text>
                <TextInput 
                    value={formData.endDate}
                    onChangeText={(t) => setFormData({ ...formData, endDate: t })}
                    placeholder="YYYY-MM-DD"
                    className="font-bold text-gray-800"
                />
            </View>
        </View>

        <Text className="text-gray-400 font-bold mb-4 uppercase tracking-widest text-xs">ALASAN / KETERANGAN</Text>
        <View className="bg-gray-50 p-4 rounded-3xl border border-gray-100 mb-10 h-40">
            <TextInput 
                multiline
                placeholder="Tuliskan alasan permohonan Anda di sini..."
                className="font-medium text-gray-800 flex-1"
                textAlignVertical="top"
                value={formData.reason}
                onChangeText={(t) => setFormData({ ...formData, reason: t })}
            />
        </View>

        <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className={`bg-blue-500 p-5 rounded-3xl items-center shadow-lg ${loading ? 'opacity-70' : ''}`}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className="text-white font-bold text-lg">Kirim Permohonan</Text>
            )}
        </TouchableOpacity>
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
