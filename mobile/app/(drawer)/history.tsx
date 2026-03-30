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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  Info, 
  RotateCcw,
  ChevronDown,
  Check,
  LogIn,
  LogOut,
  MapPin,
  AlertCircle,
  Calendar
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { API_URL } from '../../services/api';

interface AttendanceLog {
  id: number;
  type: string;
  status: string;
  timestamp: string;
  note: string;
  photo_url: string;
  location_lat: number;
  location_lng: number;
  shift_name: string;
  shift_start: string;
  shift_end: string;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEARS = [2024, 2025, 2026];

export default function AttendanceHistoryScreen() {
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
  const [history, setHistory] = useState<AttendanceLog[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  const getMonthData = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
        daysInMonth: lastDay.getDate()
    };
  };

  const { start, end, daysInMonth } = getMonthData(selectedMonth, selectedYear);

  const fetchData = async (id: string, m: number, y: number) => {
    setLoading(true);
    const { start: s, end: e } = getMonthData(m, y);
    try {
      const res = await axios.get(`${API_URL}/presence/history?employee_id=${id}&start=${s}&end=${e}`);
      if (res.data.success) {
        setHistory(res.data.data);
        setLeaves(res.data.leaves || []);
      }
    } catch (error) {
      console.error('Fetch History Error:', error);
      Alert.alert('Eror', 'Gagal mengambil riwayat absen.');
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

  const calculateLateMinutes = (timestamp: string, shiftStart: string) => {
    if (!timestamp || !shiftStart) return 0;
    
    const logTime = new Date(timestamp);
    const [sh, sm] = shiftStart.split(':').map(Number);
    
    const logMinutes = (logTime.getHours() * 60) + logTime.getMinutes();
    const shiftMinutes = (sh * 60) + sm;
    
    return Math.max(0, logMinutes - shiftMinutes);
  };

  // Group logs by date and generate full month data
  const fullMonthData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayLogs = history.filter(log => {
        if (!log.timestamp) return false;
        // Robust date extraction (works for 'YYYY-MM-DD', 'YYYY-MM-DD 00:00:00', and ISO strings)
        const logDate = log.timestamp.split('T')[0].split(' ')[0];
        return logDate === dateStr;
    });

    const clockIn = dayLogs.find(l => l.type === 'clock_in');
    const clockOut = dayLogs.find(l => l.type === 'clock_out');

    // Find any approved leave for this date
    const leave = leaves.find(l => {
        return dateStr >= l.start_date && dateStr <= l.end_date;
    });

    return {
        date: dateStr,
        day,
        clockIn,
        clockOut,
        leave,
        hasData: dayLogs.length > 0 || !!leave
    };
  });

  const scrollToToday = useCallback((data: any[]) => {
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
  }, []);

  useEffect(() => {
    if (!loading && fullMonthData.length > 0 && selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) {
        scrollToToday(fullMonthData);
    }
  }, [loading, selectedMonth, selectedYear, scrollToToday]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: any }) => {
    const itemDate = new Date(item.date);
    const isToday = itemDate.toDateString() === now.toDateString();
    const isSunday = itemDate.getDay() === 0;

    let lateMinutes = 0;
    if (item.clockIn && item.clockIn.status === 'late') {
        lateMinutes = calculateLateMinutes(item.clockIn.timestamp, item.clockIn.shift_start);
    }

    return (
        <View 
            className={`bg-white rounded-[28px] p-5 mb-4 border ${
                isToday ? 'border-blue-200 bg-blue-50/10' : 
                isSunday ? 'border-red-100 bg-red-50/10' : 
                'border-slate-100 shadow-sm'
            }`}
        >
            <View className="flex-row items-center justify-between mb-4">
                <View>
                    <Text className={`font-bold text-sm ${isToday ? 'text-blue-600' : isSunday ? 'text-red-500' : 'text-slate-800'}`}>
                        {formatDate(item.date)}
                        {isToday && <Text className="text-[10px] font-black ml-2 uppercase"> • HARI INI</Text>}
                    </Text>
                    {item.clockIn?.shift_name && !item.leave && (
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter mt-0.5">
                            Shift: {item.clockIn.shift_name} ({item.clockIn.shift_start.substring(0, 5)} - {item.clockIn.shift_end.substring(0, 5)})
                        </Text>
                    )}
                </View>
                {!item.hasData && !isSunday && !item.leave && (
                    <View className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Text className="text-slate-400 font-bold text-[9px] uppercase">Alpha / Libur</Text>
                    </View>
                )}
                {item.leave && !item.clockIn && (
                    <View className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        <Text className="text-blue-600 font-black text-[9px] uppercase">Izin / Cuti</Text>
                    </View>
                )}
                {isSunday && !item.hasData && !item.leave && (
                    <View className="bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                        <Text className="text-red-500 font-bold text-[9px] uppercase">Libur</Text>
                    </View>
                )}
                {item.leave && (
                    <View className="bg-blue-600 px-3 py-1.5 rounded-xl">
                        <Text className="text-white font-black text-[9px] uppercase">{item.leave.type}</Text>
                    </View>
                )}
            </View>

            {item.leave && (
                <View className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex-row items-center">
                    <View className="w-10 h-10 bg-blue-100 rounded-2xl items-center justify-center mr-4">
                        <Calendar size={20} color="#2563eb" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-blue-900 font-black text-[10px] uppercase tracking-widest">Keterangan Izin</Text>
                        <Text className="text-blue-700 font-bold text-sm mt-0.5 capitalize">{item.leave.type}: {item.leave.reason || 'Sesuai permohonan'}</Text>
                    </View>
                </View>
            )}

            {item.hasData && !item.leave && (
                <View className="flex-row space-x-3">
                    {/* Clock In Section */}
                    <View className="flex-1 bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50">
                        <View className="flex-row items-center mb-2">
                            <LogIn size={14} color="#10b981" />
                            <Text className="text-slate-400 text-[10px] font-bold uppercase ml-2 tracking-tighter">Masuk</Text>
                        </View>
                        {item.clockIn ? (
                            <View>
                                <Text className="text-lg font-black text-slate-800">
                                    {new Date(item.clockIn.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                {item.clockIn.status === 'late' && lateMinutes > 0 ? (
                                    <View className="flex-row items-center mt-1">
                                        <AlertCircle size={10} color="#f59e0b" />
                                        <Text className="text-amber-500 font-black text-[9px] ml-1 uppercase">Terlambat {lateMinutes} Mnt</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-emerald-500 font-black text-[9px] uppercase">Tepat Waktu</Text>
                                        {item.clockIn.note?.includes('Face Scan') && (
                                            <Text className="text-slate-300 text-[8px] font-bold ml-1">• FACE SCAN</Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        ) : (
                            <Text className="text-slate-300 font-bold text-xs">--:--</Text>
                        )}
                    </View>

                    {/* Clock Out Section */}
                    <View className="flex-1 bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50">
                        <View className="flex-row items-center mb-2">
                            <LogOut size={14} color="#ef4444" />
                            <Text className="text-slate-400 text-[10px] font-bold uppercase ml-2 tracking-tighter">Pulang</Text>
                        </View>
                        {item.clockOut ? (
                            <View>
                                <Text className="text-lg font-black text-slate-800">
                                    {new Date(item.clockOut.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <Text className="text-slate-400 font-black text-[9px] uppercase">Selesai</Text>
                                    {item.clockOut.note?.includes('Face Scan') && (
                                        <Text className="text-slate-300 text-[8px] font-bold ml-1">• FACE SCAN</Text>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <Text className="text-slate-300 font-bold text-xs">--:--</Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
  };

  const handleReset = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
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
        <Text className="text-slate-800 font-bold tracking-tight text-lg">Riwayat Absen</Text>
        <TouchableOpacity onPress={handleReset} className="p-2 -mr-2">
            <RotateCcw size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Selector Row */}
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
            flatListRef.current?.scrollToOffset({ offset: 100 * info.index, animated: true });
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
                    LOG PRESENSI: {MONTHS[selectedMonth]} {selectedYear}
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
                    Riwayat absen di atas disinkronkan secara real-time dengan server ITNET. Hubungi HRD jika terdapat perbedaan data.
                </Text>
            </View>
        }
      />

      {loading && !refreshing && (
        <View className="absolute inset-0 bg-white/80 items-center justify-center z-50">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-400 mt-4 font-bold text-xs tracking-widest uppercase">Sinkronisasi Log...</Text>
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
