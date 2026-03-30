import React, { useState, useEffect, useRef } from 'react';
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
  DeviceEventEmitter
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  Info, 
  RotateCcw,
  ChevronDown,
  Check
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { API_URL } from '../../services/api';

interface Shift {
  id: number;
  date: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  color: string;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEARS = [2024, 2025, 2026];

const DEFAULT_SHIFT = {
  shift_name: 'Full',
  start_time: '09:00:00',
  end_time: '23:59:00',
  color: '#0a84ff',
  is_default: true
};

export default function ScheduleScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const getMonthRange = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
        displayLabel: `${MONTHS[month]} ${year}`,
        daysInMonth: lastDay.getDate()
    };
  };

  const { daysInMonth } = getMonthRange(selectedMonth, selectedYear);

  const fetchData = async (id: string, month: number, year: number) => {
    setLoading(true);
    const { start, end } = getMonthRange(month, year);
    try {
      const res = await axios.get(`${API_URL}/presence/schedule?employee_id=${id}&start=${start}&end=${end}`);
      if (res.data.success) {
        setShifts(res.data.data);
        // Signal GlobalShiftFooter to update its data instantly
        DeviceEventEmitter.emit('refresh_current_shift');
      }
    } catch (error) {
      console.error('Fetch Schedule Error:', error);
      Alert.alert('Eror', 'Gagal mengambil data jadwal.');
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

  const scrollToToday = (data: any[]) => {
    const todayIndex = data.findIndex(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === now.toDateString();
    });

    if (todayIndex !== -1) {
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: todayIndex,
                animated: true,
                viewPosition: 0.2
            });
        }, 500);
    }
  };

  const handleReset = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  // Merge API data with full month dates
  const fullMonthData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Find if this date has a custom shift from API
    const existing = shifts.find(s => {
        const d = new Date(s.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const sFormatted = `${year}-${month}-${day}`;
        return sFormatted === dateStr;
    });

    return existing ? { ...existing, is_default: false } : { ...DEFAULT_SHIFT, date: dateStr };
  });

  useEffect(() => {
    if (!loading && fullMonthData.length > 0 && selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) {
        scrollToToday(fullMonthData);
    }
  }, [loading, selectedMonth, selectedYear]);

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const itemDate = new Date(item.date);
    const isToday = itemDate.toDateString() === now.toDateString();
    const isSunday = itemDate.getDay() === 0;

    return (
        <View 
            className={`bg-white rounded-[24px] p-5 mb-3 border ${
                isToday ? 'border-blue-200 bg-blue-50/10' : 
                isSunday ? 'border-red-100 bg-red-50/10' : 
                'border-slate-100 shadow-sm'
            }`}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <View 
                        style={{ backgroundColor: isSunday ? '#ef4444' : (item.color || '#3b82f6') }}
                        className="w-1.5 h-10 rounded-full mr-4" 
                    />
                    <View>
                        <Text className={`font-bold text-sm ${
                            isToday ? 'text-blue-600' : 
                            isSunday ? 'text-red-500' : 
                            'text-slate-800'
                        }`}>
                            {formatDate(item.date)}
                            {isToday && <Text className="text-[10px] font-black ml-2 uppercase"> • HARI INI</Text>}
                            {isSunday && !isToday && <Text className="text-[10px] font-black ml-2 uppercase opacity-50"> • LIBUR</Text>}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                            <Text className={`text-xs ${isSunday ? 'text-red-400' : 'text-slate-400'}`}>
                                {isSunday ? 'Hari Libur' : item.shift_name}
                            </Text>
                            {/* @ts-ignore */}
                            {item.is_default && !isSunday && (
                                <View className="ml-2 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    <Text className="text-slate-400 text-[8px] font-black uppercase tracking-tighter">Normal</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                
                <View className="items-end">
                    <View className={`flex-row items-center px-3 py-2 rounded-xl border ${
                        isSunday ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                        <Clock size={12} color={isSunday ? '#ef4444' : "#64748b"} />
                        <Text className={`ml-2 font-bold text-xs ${isSunday ? 'text-red-600' : 'text-slate-600'}`}>
                            {isSunday ? '--:--' : `${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}`}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
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
        <Text className="text-slate-800 font-bold tracking-tight text-lg">Jadwal Shift</Text>
        <TouchableOpacity onPress={handleReset} className="p-2 -mr-2">
            <RotateCcw size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Simplified Selector Row */}
      <View className="bg-white border-b border-slate-100 px-6 py-4 flex-row items-center justify-center space-x-3">
        <TouchableOpacity 
            onPress={() => setShowMonthPicker(true)}
            className="flex-row items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 min-w-[130px] justify-between"
        >
            <Text className="text-slate-800 font-bold text-sm mr-2">{MONTHS[selectedMonth]}</Text>
            <ChevronDown size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity 
            onPress={() => setShowYearPicker(true)}
            className="flex-row items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 min-w-[100px] justify-between"
        >
            <Text className="text-slate-800 font-bold text-sm mr-2">{selectedYear}</Text>
            <ChevronDown size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={fullMonthData}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({ offset: (info.averageItemLength || ITEM_HEIGHT) * info.index, animated: true });
            setTimeout(() => {
                if (fullMonthData.length > info.index) {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.2 });
                }
            }, 100);
        }}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
            <View className="flex-row items-center justify-between mb-6">
                <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    JADWAL BULAN: {MONTHS[selectedMonth]} {selectedYear}
                </Text>
                <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <Text className="text-blue-600 text-[9px] font-black">{daysInMonth} HARI</Text>
                </View>
            </View>
        }
        ListFooterComponent={
            <View className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-200/50 flex-row items-start">
                <Info size={16} color="#94a3b8" style={{ marginTop: 2 }} />
                <Text className="text-slate-400 text-[11px] leading-relaxed ml-3 flex-1">
                    Jadwal di atas adalah penugasan resmi dari HRD ITNET. Jika terdapat ketidaksesuaian, harap segera hubungi PIC divisi Anda.
                </Text>
            </View>
        }
      />

      {loading && !refreshing && (
        <View className="absolute inset-0 bg-white/80 items-center justify-center z-50">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-400 mt-4 font-bold text-xs tracking-widest uppercase">Memperbarui...</Text>
        </View>
      )}

      {/* Pickers */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
            <View className="flex-1 bg-black/50 justify-center px-6">
                <TouchableWithoutFeedback>
                    <View className="bg-white rounded-[32px] overflow-hidden shadow-2xl">
                        <View className="px-6 py-5 border-b border-slate-100 flex-row items-center justify-between">
                            <Text className="text-slate-800 font-bold text-lg">Pilih Bulan</Text>
                            <TouchableOpacity onPress={() => setShowMonthPicker(false)} className="bg-slate-50 p-2 rounded-full border border-slate-100">
                                <ChevronDown size={20} color="#64748b" />
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
                                                isSelected ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-transparent'
                                            }`}
                                        >
                                            <Text className={`font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                                {item}
                                            </Text>
                                            {isSelected && <Check size={16} color="#2563eb" />}
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

      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowYearPicker(false)}>
            <View className="flex-1 bg-black/50 justify-center px-6">
                <TouchableWithoutFeedback>
                    <View className="bg-white rounded-[32px] overflow-hidden shadow-2xl">
                        <View className="px-6 py-5 border-b border-slate-100 flex-row items-center justify-between">
                            <Text className="text-slate-800 font-bold text-lg">Pilih Tahun</Text>
                            <TouchableOpacity onPress={() => setShowYearPicker(false)} className="bg-slate-50 p-2 rounded-full border border-slate-100">
                                <ChevronDown size={20} color="#64748b" />
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
                                                isSelected ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-transparent'
                                            }`}
                                        >
                                            <Text className={`font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                                {year}
                                            </Text>
                                            {isSelected && <Check size={16} color="#2563eb" />}
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

const ITEM_HEIGHT = 100;
