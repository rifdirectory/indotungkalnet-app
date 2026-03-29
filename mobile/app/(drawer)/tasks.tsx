import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { 
  ArrowLeft, 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  MoreVertical,
  User,
  MapPin,
  Calendar,
  Filter,
  Search,
  ChevronDown
} from 'lucide-react-native';
import axios from 'axios';

import { API_URL } from '../../services/api';

export default function MyTasksScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [range, setRange] = useState<'today' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTasks = async (idToUse?: string, tabOverride?: string, rangeOverride?: string) => {
    const id = idToUse || userId;
    if (!id) return;
    
    // Non-blocking for background polling
    if (!refreshing && tasks.length > 0) {
        // Just silent update
    }

    try {
        const currentTab = tabOverride || activeTab;
        const currentRange = rangeOverride || range;
        
        let url = `${API_URL}/tasks?employee_id=${id}&mode=${currentTab}`;
        if (currentTab === 'history') {
            url += `&range=${currentRange}`;
            if (currentRange === 'custom') {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
        }

        const res = await axios.get(url);
        if (res.data.success) {
            setTasks(res.data.data);
        }
    } catch (error) {
        console.error('Fetch Tasks Error:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
        let interval: NodeJS.Timeout;

        const init = async () => {
            const storedId = await SecureStore.getItemAsync('user_id');
            if (storedId) {
                setUserId(storedId);
                fetchTasks(storedId);

                // Polling hanya untuk tab "Aktif" agar hemat baterai
                if (activeTab === 'active') {
                    interval = setInterval(() => {
                        fetchTasks(storedId);
                    }, 15000);
                }
            } else {
                setLoading(false);
            }
        };

        init();

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTab, range, startDate, endDate])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const statusMap: any = {
      completed: { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} color="#16a34a" /> },
      selesai: { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} color="#16a34a" /> },
      closed: { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} color="#16a34a" /> },
      resolved: { label: 'VERIFIKASI', color: '#a855f7', bg: '#f3e8ff', icon: <Clock size={16} color="#a855f7" /> },
      'sudah diperbaiki': { label: 'VERIFIKASI', color: '#a855f7', bg: '#f3e8ff', icon: <Clock size={16} color="#a855f7" /> },
      in_progress: { label: 'PROSES', color: '#0a84ff', bg: '#eff6ff', icon: <PlayCircle size={16} color="#0a84ff" /> },
      'sedang dikerjakan': { label: 'PROSES', color: '#0a84ff', bg: '#eff6ff', icon: <PlayCircle size={16} color="#0a84ff" /> },
      otw: { label: 'OTW', color: '#f97316', bg: '#fff7ed', icon: <MapPin size={16} color="#f97316" /> }
  };

  const getStatusInfo = (status: string) => {
    return statusMap[status?.toLowerCase()] || { label: 'MENUNGGU', color: '#d97706', bg: '#fffbeb', icon: <Clock size={16} color="#d97706" /> };
  };

  const navigateToDetail = (task: any) => {
    router.push({
      pathname: `/task-detail/${task.id}`,
      params: { type: task.type }
    });
  };

  const changeTab = (tab: 'active' | 'history') => {
      setLoading(true);
      setActiveTab(tab);
      fetchTasks(userId || undefined, tab);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#0a84ff" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header with Dual Tabs */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-2 bg-white flex-row items-center justify-between z-10"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#334155" />
        </TouchableOpacity>
        <View className="flex-row bg-slate-100 p-1 rounded-2xl flex-1 mx-4">
            <TouchableOpacity 
                onPress={() => changeTab('active')}
                className={`flex-1 py-2 px-3 rounded-xl items-center ${activeTab === 'active' ? 'bg-white shadow-sm' : ''}`}
            >
                <Text className={`text-[11px] font-black uppercase ${activeTab === 'active' ? 'text-blue-600' : 'text-slate-400'}`}>Aktif</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => changeTab('history')}
                className={`flex-1 py-2 px-3 rounded-xl items-center ${activeTab === 'history' ? 'bg-white shadow-sm' : ''}`}
            >
                <Text className={`text-[11px] font-black uppercase ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-400'}`}>Riwayat</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity className="p-2 -mr-2">
            <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        {/* Sub-Filters for History Tab */}
        {activeTab === 'history' && (
            <View className="px-6 pt-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {[
                        { id: 'today', label: 'Hari Ini' },
                        { id: 'month', label: 'Bulan Ini' },
                        { id: 'custom', label: 'Kostum' },
                    ].map((f) => (
                        <TouchableOpacity 
                            key={f.id}
                            onPress={() => setRange(f.id as any)}
                            className={`px-5 py-2.5 rounded-2xl mr-2 border ${range === f.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-100'}`}
                        >
                            <Text className={`text-xs font-bold ${range === f.id ? 'text-white' : 'text-slate-500'}`}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {range === 'custom' && (
                    <View className="flex-row mt-4 space-x-2">
                        <View className="flex-1 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex-row items-center">
                            <Calendar size={14} color="#94a3b8" />
                            <TextInput 
                                value={startDate}
                                onChangeText={setStartDate}
                                className="ml-2 text-[11px] font-bold text-slate-800"
                                placeholder="Start"
                            />
                        </View>
                        <View className="items-center justify-center"><Text className="text-slate-300">-</Text></View>
                        <View className="flex-1 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex-row items-center">
                             <Calendar size={14} color="#94a3b8" />
                            <TextInput 
                                value={endDate}
                                onChangeText={setEndDate}
                                className="ml-2 text-[11px] font-bold text-slate-800"
                                placeholder="End"
                            />
                        </View>
                    </View>
                )}
            </View>
        )}

        <View className="px-6 pt-6">
            <View className="mb-4">
                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                    {activeTab === 'active' ? 'PENUGASAN & TIKET AKTIF' : 'RIWAYAT PEKERJAAN'}
                </Text>
            </View>
        </View>

        {tasks.map((task) => {
          const statusInfo = getStatusInfo(task.status);
          const isTicket = task.type === 'ticket';
          const taskId = `${task.type}-${task.id}`;
          
          return (
            <TouchableOpacity 
                key={taskId} 
                onPress={() => navigateToDetail(task)}
                activeOpacity={0.7}
                className="bg-white rounded-3xl p-5 mb-4 mx-6 shadow-sm border border-gray-100"
            >
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center">
                        <View style={{ backgroundColor: statusInfo?.bg || '#f8fafc' }} className="px-3 py-1 rounded-full flex-row items-center mr-2">
                            {statusInfo?.icon || <Clock size={16} color="#64748b" />}
                            <Text style={{ color: statusInfo?.color || '#64748b' }} className="text-[10px] font-bold ml-1.5 uppercase">
                                {statusInfo?.label || 'UNKNOWN'}
                            </Text>
                        </View>
                        <View className={isTicket ? "bg-orange-100 px-2 py-1 rounded-md" : "bg-purple-100 px-2 py-1 rounded-md"}>
                            <Text className={isTicket ? "text-orange-600 font-bold text-[8px]" : "text-purple-600 font-bold text-[8px]"}>
                                {isTicket ? 'TIKET GANGGUAN' : 'TUGAS MANUAL'}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <Text className="text-[9px] text-gray-300 font-bold">#{task.id}</Text>
                    </View>
                </View>

                {/* Customer/Title */}
                <View className="mb-1">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">PELANGGAN / SUBJEK:</Text>
                    <Text className="text-lg font-bold text-gray-800">
                        {isTicket ? (task.customer_info?.split('(')[0]?.trim() || 'Tanpa Nama') : task.title}
                    </Text>
                </View>

                {/* PIC Names */}
                {task.pic_names && (
                    <View className="flex-row items-center mt-2 mb-1 bg-slate-50 px-3 py-1.5 rounded-xl self-start">
                        <User size={12} color="#64748b" />
                        <Text className="text-[10px] text-slate-500 font-bold ml-1.5 uppercase">PIC: {task.pic_names}</Text>
                    </View>
                )}

                <View className="flex-row items-center mt-3">
                    <Clock size={12} color="#9ca3af" />
                    <Text className="text-[10px] text-gray-400 ml-1">
                        {task.created_at ? new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </Text>
                    <Text className="text-[10px] text-blue-500 font-bold ml-auto uppercase tracking-tighter">Ketuk untuk Detail</Text>
                </View>
            </TouchableOpacity>
          );
        })}

        {tasks.length === 0 && (
            <View className="items-center justify-center py-20 px-10">
                <ClipboardCheck size={64} color="#e5e7eb" />
                <Text className="text-gray-400 mt-4 text-center">
                    {activeTab === 'active' 
                        ? 'Wah, hebat! Semua tugas Anda sudah beres.' 
                        : 'Belum ada data tugas untuk rentang waktu ini.'}
                </Text>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
