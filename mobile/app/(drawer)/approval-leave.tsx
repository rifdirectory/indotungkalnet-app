import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Calendar, 
  Check, 
  X,
  User,
  Clock,
  AlertCircle
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { API_URL } from '../../services/api';

interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  position_name: string;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function ApprovalLeaveScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  const fetchData = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/presence/leave?pic_id=${id}&status=pending`);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error('Fetch Leave Error:', error);
      Alert.alert('Eror', 'Gagal mengambil data permohonan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    async function init() {
      const id = await SecureStore.getItemAsync('user_id');
      if (id) {
        setUserId(id);
        fetchData(id);
      }
    }
    init();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (userId) fetchData(userId);
  };

  const handleAction = async (requestId: number, status: 'approved' | 'rejected') => {
    const actionText = status === 'approved' ? 'menyetujui' : 'menolak';
    
    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin ${actionText} permohonan ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Lanjutkan', 
          onPress: async () => {
            try {
              const res = await axios.put(`${API_URL}/presence/leave`, {
                id: requestId,
                status: status,
                approved_by: userId
              });

              if (res.data.success) {
                Alert.alert('Berhasil', `Permohonan telah ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
                if (userId) fetchData(userId);
              }
            } catch (error) {
              console.error('Update Leave Error:', error);
              Alert.alert('Eror', 'Gagal memperbarui status permohonan.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Header */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-4 bg-white border-b border-slate-100 flex-row items-center justify-between z-10"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 font-bold tracking-tight text-lg">Persetujuan Izin</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6">
          <Text className="text-slate-400 font-bold mb-6 uppercase tracking-widest text-[10px]">DAFTAR PERMOHONAN PENDING</Text>

          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator color="#3b82f6" />
              <Text className="text-slate-400 mt-4 font-medium">Memuat data...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View className="py-20 items-center bg-white rounded-3xl border border-slate-100 px-10">
              <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                <Check size={32} color="#cbd5e1" />
              </View>
              <Text className="text-slate-800 font-bold text-center">Tidak Ada Permohonan</Text>
              <Text className="text-slate-400 text-center mt-2 text-sm leading-relaxed">
                Semua permohonan izin dari tim Anda telah diproses.
              </Text>
            </View>
          ) : (
            requests.map((item) => (
              <View key={item.id} className="bg-white rounded-[32px] p-6 mb-4 border border-slate-100 shadow-sm">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center">
                    <User size={20} color="#3b82f6" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-slate-800 font-bold text-base" numberOfLines={1}>{item.employee_name}</Text>
                    <Text className="text-slate-400 text-xs font-medium uppercase tracking-tighter">{item.position_name}</Text>
                  </View>
                  <View className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                    <Text className="text-amber-600 text-[10px] font-black uppercase">{item.type}</Text>
                  </View>
                </View>

                <View className="bg-slate-50 rounded-2xl p-4 mb-4 flex-row justify-between">
                  <View>
                    <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">DARI</Text>
                    <Text className="text-slate-700 font-bold text-xs">{formatDate(item.start_date)}</Text>
                  </View>
                  <View className="items-center justify-center">
                    <Clock size={14} color="#cbd5e1" />
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">SAMPAI</Text>
                    <Text className="text-slate-700 font-bold text-xs">{formatDate(item.end_date)}</Text>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-2 ml-1">ALASAN</Text>
                  <View className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <Text className="text-slate-600 text-sm italic leading-relaxed">
                      "{item.reason || 'Tidak ada keterangan'}"
                    </Text>
                  </View>
                </View>

                <View className="flex-row space-x-3">
                  <TouchableOpacity 
                    onPress={() => handleAction(item.id, 'rejected')}
                    className="flex-1 bg-slate-100 py-4 rounded-2xl flex-row items-center justify-center active:bg-slate-200"
                  >
                    <X size={18} color="#ef4444" strokeWidth={3} />
                    <Text className="text-slate-600 font-bold ml-2">Tolak</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleAction(item.id, 'approved')}
                    className="flex-2 bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center shadow-md active:bg-blue-700"
                    style={{ flex: 1.5 }}
                  >
                    <Check size={18} color="white" strokeWidth={3} />
                    <Text className="text-white font-bold ml-2">Setujui</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View className="mt-10 mb-20 items-center opacity-20">
            <AlertCircle size={20} color="#94a3b8" />
            <Text className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Peninjauan Kebijakan HRD ITNET</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
