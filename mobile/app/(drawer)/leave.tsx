import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  StatusBar, 
  RefreshControl,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Pressable
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  Info, 
  RotateCcw,
  ChevronDown,
  Check,
  Calendar,
  FileText,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { API_URL } from '../../services/api';

interface LeaveRequest {
  id: number;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEARS = [2024, 2025, 2026];

export default function LeaveScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    type: 'izin',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const fetchData = async (id: string, m: number, y: number) => {
    setLoading(true);
    // Backend expects 1-indexed month
    const monthNum = m + 1;
    try {
      const res = await axios.get(`${API_URL}/presence/leave?employee_id=${id}&month=${monthNum}&year=${y}`);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error('Fetch Leave Error:', error);
      Alert.alert('Eror', 'Gagal mengambil riwayat permohonan.');
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
        fetchData(id, selectedMonth, selectedYear);
      }
    }
    init();
  }, [selectedMonth, selectedYear]);

  const onRefresh = () => {
    setRefreshing(true);
    if (userId) fetchData(userId, selectedMonth, selectedYear);
  };

  const handleReset = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const handleSubmit = async () => {
    if (!formData.reason) {
      Alert.alert('Gagal', 'Silakan isi alasan permohonan Anda.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // UPDATE MODE
        const res = await axios.put(`${API_URL}/presence/leave`, {
            id: editingId,
            type: formData.type,
            start_date: formData.startDate,
            end_date: formData.endDate,
            reason: formData.reason
        });

        if (res.data.success) {
            Alert.alert('Berhasil', 'Permohonan Anda telah diperbarui.');
            setShowFormModal(false);
            resetForm();
            if (userId) fetchData(userId, selectedMonth, selectedYear);
        }
      } else {
        // CREATE MODE
        const res = await axios.post(`${API_URL}/presence/leave`, {
            employee_id: userId,
            type: formData.type,
            start_date: formData.startDate,
            end_date: formData.endDate,
            reason: formData.reason
        });

        if (res.data.success) {
            Alert.alert('Berhasil', 'Permohonan Anda telah dikirim dan menunggu persetujuan PIC.');
            setShowFormModal(false);
            resetForm();
            if (userId) fetchData(userId, selectedMonth, selectedYear);
        }
      }
    } catch (error: any) {
      console.error('Submit Leave Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Gagal menyimpan permohonan. Coba lagi nanti.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
        'Hapus Permohonan',
        'Apakah Anda yakin ingin membatalkan permohonan izin ini?',
        [
            { text: 'Batal', style: 'cancel' },
            { 
                text: 'Hapus', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await axios.delete(`${API_URL}/presence/leave?id=${id}`);
                        if (res.data.success) {
                            fetchData(userId!, selectedMonth, selectedYear);
                        }
                    } catch (error) {
                        Alert.alert('Eror', 'Gagal menghapus permohonan.');
                    }
                }
            }
        ]
    );
  };

  const handleEdit = (item: LeaveRequest) => {
    setEditingId(item.id);
    setFormData({
        type: item.type,
        startDate: item.start_date.split('T')[0],
        endDate: item.end_date.split('T')[0],
        reason: item.reason
    });
    setShowFormModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
        type: 'izin',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
    });
  };

  const onDateChange = (event: any, selectedDate?: Date, type: 'start' | 'end' = 'start') => {
    // On Android, the picker closes itself after selection
    if (Platform.OS === 'android') {
        if (type === 'start') setShowStartPicker(false);
        else setShowEndPicker(false);
    }

    if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        if (type === 'start') {
            setFormData({ ...formData, startDate: dateStr });
        } else {
            setFormData({ ...formData, endDate: dateStr });
        }
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
        case 'approved':
            return (
                <View className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex-row items-center">
                    <CheckCircle2 size={12} stroke="#10b981" />
                    <Text className="text-emerald-600 font-black text-[9px] uppercase ml-1.5">DISETUJUI</Text>
                </View>
            );
        case 'rejected':
            return (
                <View className="bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 flex-row items-center">
                    <XCircle size={12} stroke="#f43f5e" />
                    <Text className="text-rose-600 font-black text-[9px] uppercase ml-1.5">DITOLAK</Text>
                </View>
            );
        default:
            return (
                <View className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 flex-row items-center">
                    <Clock size={12} stroke="#f59e0b" />
                    <Text className="text-amber-600 font-black text-[9px] uppercase ml-1.5">MENUNGGU</Text>
                </View>
            );
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: LeaveRequest }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm shadow-slate-100 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
                <Text className="text-slate-800 font-bold text-sm capitalize">{item.type}</Text>
                <Text className="text-slate-300 mx-2 text-xs">|</Text>
                <Text className="text-slate-500 text-[10px] font-medium">
                    {formatDate(item.start_date)}{item.start_date !== item.end_date ? ` - ${formatDate(item.end_date)}` : ''}
                </Text>
            </View>
            <Text className="text-slate-400 text-[10px] italic" numberOfLines={1}>
                {item.reason || 'Tanpa keterangan'}
            </Text>
        </View>
        <View className="items-end">
            <View className="mb-2">
                {renderStatusBadge(item.status)}
            </View>
            
            {item.status === 'pending' && (
                <View className="flex-row items-center space-x-2">
                    <TouchableOpacity 
                        onPress={() => handleEdit(item)}
                        className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center border border-blue-100"
                    >
                        <Pencil size={12} stroke="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDelete(item.id)}
                        className="w-8 h-8 bg-rose-50 rounded-full items-center justify-center border border-rose-100"
                    >
                        <Trash2 size={12} stroke="#f43f5e" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Header */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-4 bg-white border-b border-slate-100 flex-row items-center justify-between z-10"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} stroke="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 font-bold tracking-tight text-lg">Permohonan Izin</Text>
        <TouchableOpacity onPress={handleReset} className="p-2 -mr-2">
            <RotateCcw size={20} stroke="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Selector Row */}
      <View className="bg-white border-b border-slate-100 px-6 py-4 flex-row items-center justify-center space-x-3">
        <TouchableOpacity 
            onPress={() => setShowMonthPicker(true)}
            className="flex-row items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 min-w-[130px] justify-between"
        >
            <Text className="text-slate-800 font-bold text-sm mr-2">{MONTHS[selectedMonth]}</Text>
            <ChevronDown size={16} stroke="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity 
            onPress={() => setShowYearPicker(true)}
            className="flex-row items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 min-w-[100px] justify-between"
        >
            <Text className="text-slate-800 font-bold text-sm mr-2">{selectedYear}</Text>
            <ChevronDown size={16} stroke="#64748b" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
            <View className="mb-6">
                <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-4">
                    RIWAYAT PERMOHONAN: {MONTHS[selectedMonth]} {selectedYear}
                </Text>
                <TouchableOpacity 
                    onPress={() => {
                        resetForm();
                        setShowFormModal(true);
                    }}
                    className="bg-blue-600 p-4 rounded-3xl flex-row items-center justify-center shadow-lg shadow-blue-200"
                >
                    <Plus size={20} stroke="white" />
                    <Text className="text-white font-bold ml-2">Ajukan Izin Baru</Text>
                </TouchableOpacity>
            </View>
        }
        ListEmptyComponent={
            !loading && (
                <View className="items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 px-10">
                    <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                        <FileText size={32} stroke="#cbd5e1" />
                    </View>
                    <Text className="text-slate-800 font-bold text-center">Tidak Ada Permohonan</Text>
                    <Text className="text-slate-400 text-center mt-2 text-sm leading-5">
                        Anda belum mengajukan izin untuk periode ini. Klik tombol di atas untuk membuat permohonan.
                    </Text>
                </View>
            )
        }
      />

      {loading && !refreshing && (
        <View className="absolute inset-0 bg-white/80 items-center justify-center z-50">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-400 mt-4 font-bold text-xs tracking-widest uppercase text-center px-10">Mengambil Data Izin...</Text>
        </View>
      )}

      {/* NEW REQUEST MODAL */}
      <Modal visible={showFormModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 max-h-[90%] shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
                <Text className="text-slate-800 font-bold text-2xl tracking-tighter">
                    {editingId ? 'Edit Izin' : 'Ajukan Izin'}
                </Text>
                <TouchableOpacity onPress={() => setShowFormModal(false)} className="bg-slate-100 p-2 rounded-full">
                    <ChevronDown size={24} stroke="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-[10px]">Pilih Jenis Permohonan</Text>
                <View className="flex-row space-x-3 mb-8">
                    {['izin', 'sakit', 'cuti'].map((t) => (
                        <TouchableOpacity 
                            key={t}
                            onPress={() => setFormData({ ...formData, type: t })}
                            className={`flex-1 p-4 rounded-2xl border items-center ${formData.type === t ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-100'}`}
                        >
                            <Text className={`font-bold capitalize text-xs ${formData.type === t ? 'text-blue-600' : 'text-slate-400'}`}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-[10px]">Tentukan Rentang Tanggal</Text>
                <View className="flex-row space-x-4 mb-8">
                    <TouchableOpacity 
                        onPress={() => setShowStartPicker(true)}
                        className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                    >
                        <Text className="text-slate-400 text-[8px] font-black uppercase mb-1">DARI</Text>
                        <View className="flex-row items-center justify-between">
                            <Text className="font-bold text-slate-800 text-sm">{formatDate(formData.startDate)}</Text>
                            <Calendar size={14} stroke="#64748b" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => setShowEndPicker(true)}
                        className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                    >
                        <Text className="text-slate-400 text-[8px] font-black uppercase mb-1">SAMPAI</Text>
                        <View className="flex-row items-center justify-between">
                            <Text className="font-bold text-slate-800 text-sm">{formatDate(formData.endDate)}</Text>
                            <Calendar size={14} stroke="#64748b" />
                        </View>
                    </TouchableOpacity>
                </View>

                {showStartPicker && (
                    <DateTimePicker
                        value={new Date(formData.startDate)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, d) => onDateChange(e, d, 'start')}
                    />
                )}

                {showEndPicker && (
                    <DateTimePicker
                        value={new Date(formData.endDate)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, d) => onDateChange(e, d, 'end')}
                    />
                )}

                <Text className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-[10px]">Alasan Permohonan</Text>
                <View className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 mb-10 h-40">
                    <TextInput 
                        multiline
                        placeholder="Tuliskan alasan lengkap permohonan Anda..."
                        className="font-medium text-slate-800 flex-1 text-sm leading-5"
                        textAlignVertical="top"
                        value={formData.reason}
                        onChangeText={(t) => setFormData({ ...formData, reason: t })}
                    />
                </View>

                <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={submitting}
                    className={`bg-blue-600 p-5 rounded-3xl items-center shadow-lg shadow-blue-100 mb-10 ${submitting ? 'opacity-70' : ''}`}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg tracking-tight">
                            {editingId ? 'Simpan Perubahan' : 'Kirim Sekarang'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Filter Pickers (Same as Schedule/History) */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
            <View className="flex-1 bg-black/50 justify-center px-6">
                <TouchableWithoutFeedback>
                    <View className="bg-white rounded-[32px] overflow-hidden shadow-2xl">
                        <View className="px-6 py-5 border-b border-slate-100 flex-row items-center justify-between">
                            <Text className="text-slate-800 font-bold text-lg">Pilih Bulan</Text>
                            <TouchableOpacity onPress={() => setShowMonthPicker(false)} className="bg-slate-50 p-2 rounded-full border border-slate-100">
                                <ChevronDown size={20} stroke="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="max-h-[400px] p-4">
                            <View className="flex-row flex-wrap">
                                {MONTHS.map((item, idx) => {
                                    const isSelected = idx === selectedMonth;
                                    return (
                                        <TouchableOpacity 
                                            key={idx}
                                            onPress={() => {
                                                setSelectedMonth(idx);
                                                setShowMonthPicker(false);
                                            }}
                                            className={`w-[48%] m-[1%] p-4 rounded-2xl flex-row items-center justify-between border-2 ${
                                                isSelected ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-transparent'
                                            }`}
                                        >
                                            <Text className={`font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                                {item}
                                            </Text>
                                            {isSelected && <Check size={16} stroke="#2563eb" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showYearPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowYearPicker(false)}>
            <View className="flex-1 bg-black/50 justify-center px-6">
                <TouchableWithoutFeedback>
                    <View className="bg-white rounded-[32px] overflow-hidden shadow-2xl">
                        <View className="px-6 py-5 border-b border-slate-100 flex-row items-center justify-between">
                            <Text className="text-slate-800 font-bold text-lg">Pilih Tahun</Text>
                            <TouchableOpacity onPress={() => setShowYearPicker(false)} className="bg-slate-50 p-2 rounded-full border border-slate-100">
                                <ChevronDown size={20} stroke="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="max-h-[400px] p-4">
                            <View className="flex-row items-center justify-start flex-wrap">
                                {YEARS.map((year, idx) => {
                                    const isSelected = year === selectedYear;
                                    return (
                                        <TouchableOpacity 
                                            key={idx}
                                            onPress={() => {
                                                setSelectedYear(year);
                                                setShowYearPicker(false);
                                            }}
                                            className={`w-[48%] m-[1%] p-4 rounded-2xl flex-row items-center justify-between border-2 ${
                                                isSelected ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-transparent'
                                            }`}
                                        >
                                            <Text className={`font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                                {year}
                                            </Text>
                                            {isSelected && <Check size={16} stroke="#2563eb" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
