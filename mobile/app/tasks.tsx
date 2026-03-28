import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { 
  ArrowLeft, 
  ClipboardCheck, 
  Clock, 
  MapPin,
  CheckCircle2, 
  PlayCircle, 
  AlertCircle,
  MoreVertical
} from 'lucide-react-native';
import axios from 'axios';

const API_URL = 'http://192.168.1.7:3000/api';

export default function MyTasksScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async (idToUse?: string) => {
    const id = idToUse || userId;
    if (!id) return;
    
    try {
      const res = await axios.get(`${API_URL}/tasks?employee_id=${id}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const storedId = await SecureStore.getItemAsync('user_id');
      if (storedId) {
        setUserId(storedId);
        fetchTasks(storedId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const updateStatus = async (id: number, newStatus: string, taskType: 'ticket' | 'manual') => {
    try {
      const res = await axios.patch(`${API_URL}/tasks`, { id, status: newStatus, type: taskType });
      if (res.data.success) {
        fetchTasks();
      }
    } catch (error) {
      Alert.alert('Eror', 'Gagal memperbarui status tugas');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'selesai' || s === 'closed') {
        return { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} color="#16a34a" /> };
    }
    if (s === 'resolved') {
        return { label: 'VERIFIKASI', color: '#a855f7', bg: '#f3e8ff', icon: <Clock size={16} color="#a855f7" /> };
    }
    if (s === 'in_progress' || s === 'open' || s === 'sedang dikerjakan' || s === 'otw') {
        return { label: 'PROSES', color: '#0a84ff', bg: '#eff6ff', icon: <PlayCircle size={16} color="#0a84ff" /> };
    }
    return { label: 'MENUNGGU', color: '#d97706', bg: '#fffbeb', icon: <Clock size={16} color="#d97706" /> };
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#0a84ff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">Tugas Saya</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mb-4">
            <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">PENUGASAN & TIKET AKTIF</Text>
        </View>

        {tasks.map((task) => {
          const statusInfo = getStatusInfo(task.status);
          const isTicket = task.type === 'ticket';
          
          return (
            <View key={`${task.type}-${task.id}`} className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center">
                        <View style={{ backgroundColor: statusInfo.bg }} className="px-3 py-1 rounded-full flex-row items-center mr-2">
                            {statusInfo.icon}
                            <Text style={{ color: statusInfo.color }} className="text-[10px] font-bold ml-1.5 uppercase">
                                {statusInfo.label}
                            </Text>
                        </View>
                        <View className={isTicket ? "bg-orange-100 px-2 py-1 rounded-md" : "bg-purple-100 px-2 py-1 rounded-md"}>
                            <Text className={isTicket ? "text-orange-600 font-bold text-[9px]" : "text-purple-600 font-bold text-[9px]"}>
                                {isTicket ? 'TIKET GANGGUAN' : 'TUGAS MANUAL'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity><MoreVertical size={16} color="#9ca3af" /></TouchableOpacity>
                </View>

                <Text className="text-lg font-bold text-gray-800 mb-1">{task.title}</Text>
                <Text className="text-gray-500 mb-4 leading-5">{task.description}</Text>

                {isTicket && task.customer_info && (
                    <View className="bg-gray-50 p-3 rounded-2xl mb-4 border border-gray-100">
                        <Text className="text-[10px] text-gray-400 font-bold mb-1">DATA PELANGGAN:</Text>
                        <Text className="text-gray-700 font-medium">{task.customer_info}</Text>
                    </View>
                )}

                <View className="flex-row items-center mb-5">
                    <AlertCircle size={14} color="#6b7280" />
                    <Text className="text-gray-500 text-xs ml-1.5">
                        {isTicket ? 'Tiket Masuk: ' : 'Deadline: '}
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                    </Text>
                </View>

                <View className="flex-row space-x-3">
                    {/* Tahap 1: Berangkat (OTW) */}
                    {(task.status.toLowerCase() === 'open' || task.status.toLowerCase() === 'pending') && isTicket && (
                        <TouchableOpacity 
                            onPress={() => updateStatus(task.id, 'OTW', task.type)}
                            className="flex-1 bg-orange-500 py-3 rounded-2xl items-center flex-row justify-center"
                        >
                            <MapPin size={18} color="white" />
                            <Text className="text-white font-bold ml-2">Berangkat (OTW)</Text>
                        </TouchableOpacity>
                    )}

                    {/* Tahap 2: Mulai Kerja (Arrived) */}
                    {(task.status.toLowerCase() === 'otw' || (!isTicket && (task.status.toLowerCase() === 'open' || task.status.toLowerCase() === 'pending'))) && (
                        <TouchableOpacity 
                            onPress={() => updateStatus(task.id, 'in_progress', task.type)}
                            className="flex-1 bg-blue-500 py-3 rounded-2xl items-center flex-row justify-center"
                        >
                            <PlayCircle size={18} color="white" />
                            <Text className="text-white font-bold ml-2">Mulai Kerja</Text>
                        </TouchableOpacity>
                    )}

                    {/* Tahap 3: Selesai */}
                    {(task.status.toLowerCase() === 'in_progress' || task.status.toLowerCase() === 'sedang dikerjakan') && (
                        <TouchableOpacity 
                            onPress={() => updateStatus(task.id, isTicket ? 'Resolved' : 'completed', task.type)}
                            className="flex-1 bg-green-500 py-3 rounded-2xl items-center flex-row justify-center"
                        >
                            <CheckCircle2 size={18} color="white" />
                            <Text className="text-white font-bold ml-2">Selesai</Text>
                        </TouchableOpacity>
                    )}

                    {/* Tahap 4: Menunggu Verifikasi */}
                    {task.status.toLowerCase() === 'resolved' && (
                        <View className="flex-1 bg-purple-50 py-3 rounded-2xl items-center flex-row justify-center border border-purple-100">
                            <Clock size={18} color="#a855f7" />
                            <Text className="text-purple-600 font-bold ml-2">Menunggu Verifikasi Admin</Text>
                        </View>
                    )}

                    {/* Tahap 5: Finish / Closed */}
                    {(task.status.toLowerCase() === 'completed' || task.status.toLowerCase() === 'closed' || task.status.toLowerCase() === 'selesai') && (
                        <View className="flex-1 bg-gray-100 py-3 rounded-2xl items-center flex-row justify-center">
                            <CheckCircle2 size={18} color="#6b7280" />
                            <Text className="text-gray-500 font-bold ml-2">Sudah Ditutup Admin</Text>
                        </View>
                    )}
                </View>
            </View>
          );
        })}

        {tasks.length === 0 && (
            <View className="items-center justify-center py-20">
                <ClipboardCheck size={64} color="#e5e7eb" />
                <Text className="text-gray-400 mt-4 text-center">Belum ada tugas untuk Anda.{'\n'}Tetap semangat bekerja!</Text>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
