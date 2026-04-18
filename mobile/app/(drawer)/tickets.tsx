import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { 
  LifeBuoy, 
  Plus, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  MapPin, 
  Filter,
  Search,
  Menu,
  ChevronRight,
  User,
  AlertCircle
} from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function TicketListScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_URL}/support?status=${statusFilter}`);
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (error) {
      console.error('Fetch Tickets Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTickets();
    }, [statusFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const statusMap: any = {
    'Open': { label: 'TERBUKA', color: '#d97706', bg: '#fffbeb', icon: <AlertCircle size={14} color="#d97706" /> },
    'OTW': { label: 'OTW', color: '#f97316', bg: '#fff7ed', icon: <MapPin size={14} color="#f97316" /> },
    'Sedang Dikerjakan': { label: 'PROSES', color: '#0a84ff', bg: '#eff6ff', icon: <PlayCircle size={14} color="#0a84ff" /> },
    'Sudah Diperbaiki': { label: 'VERIFIKASI', color: '#a855f7', bg: '#f3e8ff', icon: <Clock size={14} color="#a855f7" /> },
    'Selesai': { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={14} color="#16a34a" /> },
    'Closed': { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={14} color="#16a34a" /> },
  };

  const getStatusInfo = (status: string) => {
    return statusMap[status] || { label: status?.toUpperCase(), color: '#64748b', bg: '#f1f5f9', icon: <Clock size={14} color="#64748b" /> };
  };

  const filteredTickets = tickets.filter(t => 
    t.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toString().includes(searchQuery)
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-4 bg-white border-b border-slate-50 flex-row items-center justify-between z-10"
      >
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-2 -ml-2">
            <Menu size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 text-lg font-extrabold tracking-tight">Tiket Support</Text>
        <TouchableOpacity 
          onPress={() => router.push('/add-ticket')}
          className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-blue-200"
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View className="px-6 py-4">
        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3 mb-4">
          <Search size={18} color="#94a3b8" />
          <TextInput 
            className="flex-1 ml-3 text-slate-700 font-medium"
            placeholder="Cari ID, Pelanggan atau Masalah..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
          {[
            { id: 'active', label: 'Aktif' },
            { id: 'Open', label: 'Baru' },
            { id: 'Sedang Dikerjakan', label: 'Proses' },
            { id: 'Sudah Diperbaiki', label: 'Verifikasi' },
            { id: 'Selesai', label: 'Selesai' },
            { id: 'all', label: 'Semua' },
          ].map((f) => (
            <TouchableOpacity 
              key={f.id}
              onPress={() => setStatusFilter(f.id)}
              className={`px-5 py-2 rounded-xl mr-2 border ${statusFilter === f.id ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-xs font-bold ${statusFilter === f.id ? 'text-white' : 'text-slate-500'}`}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        {loading ? (
          <ActivityIndicator color="#0a84ff" size="large" className="mt-10" />
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => {
            const statusInfo = getStatusInfo(ticket.status);
            return (
              <TouchableOpacity 
                key={ticket.id}
                onPress={() => router.push(`/task-detail/${ticket.id}?type=ticket`)}
                className="bg-white border border-slate-100 rounded-3xl p-5 mb-4 shadow-sm shadow-slate-200/50"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View style={{ backgroundColor: statusInfo.bg }} className="px-3 py-1 rounded-full flex-row items-center">
                    {statusInfo.icon}
                    <Text style={{ color: statusInfo.color }} className="text-[10px] font-bold ml-1.5 uppercase">
                      {statusInfo.label}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-slate-300 font-black tracking-tighter">#{ticket.id}</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Pelanggan:</Text>
                  <Text className="text-slate-800 text-lg font-bold" numberOfLines={1}>{ticket.customer_name}</Text>
                </View>

                <View className="flex-row items-center mb-4">
                  <View className="bg-slate-50 px-3 py-1.5 rounded-xl flex-row items-center flex-1 mr-2">
                    <LifeBuoy size={12} color="#64748b" />
                    <Text className="text-slate-500 text-[10px] font-bold ml-2 uppercase" numberOfLines={1}>{ticket.category}</Text>
                  </View>
                  <View className="bg-slate-50 px-3 py-1.5 rounded-xl flex-row items-center">
                    <User size={12} color="#64748b" />
                    <Text className="text-slate-500 text-[10px] font-bold ml-2 uppercase" numberOfLines={1}>{ticket.assigned_names || 'Belum Ada'}</Text>
                  </View>
                </View>

                <View className="border-t border-slate-50 pt-4 flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Clock size={12} color="#94a3b8" />
                    <Text className="text-slate-400 text-[10px] font-medium ml-2">
                       {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#cbd5e1" />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="items-center justify-center py-20">
            <LifeBuoy size={64} color="#f1f5f9" />
            <Text className="text-slate-400 mt-4 font-medium">Tidak ada tiket ditemukan</Text>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}
