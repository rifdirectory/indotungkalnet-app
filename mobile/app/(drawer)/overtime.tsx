import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  User, 
  Plus, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { API_URL } from '../../services/api';

export default function OvertimeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overtimeData, setOvertimeData] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchOvertime = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/presence/overtime?pic_id=${id}`);
      if (res.data.success) {
        setOvertimeData(res.data.data);
      }
    } catch (error) {
      console.error('Fetch Overtime Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    SecureStore.getItemAsync('user_id').then(id => {
      if (id) {
        setUserId(id);
        fetchOvertime(id);
      }
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (userId) fetchOvertime(userId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-orange-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 border-green-100';
      case 'rejected': return 'bg-red-50 border-red-100';
      default: return 'bg-orange-50 border-orange-100';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Header with Android Padding */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-4 bg-white border-b border-slate-100 flex-row items-center justify-between z-10"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 font-bold tracking-tight text-lg">Penugasan Lembur</Text>
        <TouchableOpacity 
            onPress={() => router.push('/add-overtime')}
            className="p-1"
        >
            <Plus size={24} color="#0a84ff" />
        </TouchableOpacity>
      </View>
 
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        <View className="px-6 pt-6">
        <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs">DAFTAR PENUGASAN</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-600 font-bold text-[10px]">{overtimeData.length} TOTAL</Text>
            </View>
        </View>

        {loading ? (
            <View className="mt-20 items-center">
                <ActivityIndicator size="large" color="#0a84ff" />
            </View>
        ) : overtimeData.length === 0 ? (
            <View className="mt-20 items-center bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                <Clock size={48} color="#d1d5db" />
                <Text className="mt-4 text-gray-500 font-bold text-center">Belum Ada Penugasan</Text>
                <Text className="text-gray-400 text-xs text-center mt-1">Tekan tombol (+) untuk melakukan penugasan baru.</Text>
            </View>
        ) : (
            overtimeData.map((item, index) => (
                <View key={index} className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                                <User size={20} color="#0a84ff" />
                            </View>
                            <View>
                                <Text className="font-bold text-gray-800">{item.employee_name}</Text>
                                <Text className="text-gray-400 text-[10px] uppercase font-bold">{item.position_name}</Text>
                            </View>
                        </View>
                        <View className={`px-3 py-1 rounded-full border ${getStatusBg(item.status)}`}>
                            <Text className={`font-bold text-[10px] uppercase ${getStatusColor(item.status)}`}>{item.status}</Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-gray-50 mb-4" />

                    <View className="flex-row items-center mb-2">
                        <Clock size={14} color="#6b7280" />
                        <Text className="ml-2 text-gray-600 font-medium">{item.duration_minutes} Menit ({new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})</Text>
                    </View>

                    <Text className="text-gray-500 text-xs leading-5" numberOfLines={2}>
                        {item.task_desc || 'Tidak ada deskripsi tugas.'}
                    </Text>

                    {item.ticket_subject && (
                        <View className="mt-3 bg-purple-50 p-2 rounded-xl border border-purple-100 flex-row items-center">
                            <AlertCircle size={12} color="#a855f7" />
                            <Text className="ml-2 text-[10px] text-purple-600 font-bold">Tiket: {item.ticket_subject}</Text>
                        </View>
                    )}
                </View>
            ))
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
