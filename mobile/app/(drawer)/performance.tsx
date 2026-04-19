import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput,
  RefreshControl,
  Platform
} from 'react-native';
import { 
  User, 
  ThumbsUp, 
  ThumbsDown, 
  Calendar as CalendarIcon,
  ChevronRight,
  Save,
  MessageSquare,
  Search,
  X as CloseIcon,
  Menu
} from 'lucide-react-native';
import * as SecureStore from '../../utils/storage';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PerformanceScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [id, role] = await Promise.all([
        SecureStore.getItemAsync('user_id'),
        SecureStore.getItemAsync('user_role')
      ]);
      setUserId(id);
      setUserRole(role);
      
      const picParam = role === 'admin' ? '' : `&pic_id=${id}`;
      const res = await api.get(`/performance?view=daily&date=${selectedDate}${picParam}`);
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Gagal memuat data pegawai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleRate = async (empId: string, rating: 'GOOD' | 'BAD', notes: string) => {
    if (!userId) return;
    setSubmitting(empId);
    try {
      const res = await api.post('/performance', {
        employee_id: empId,
        pic_id: userId,
        date: selectedDate,
        rating,
        notes
      });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', 'Gagal menyimpan penilaian.');
    } finally {
      setSubmitting(null);
    }
  };

  const [activeNotesId, setActiveNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onDateChange = (event: any, selected: Date | undefined) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selected) {
      const dateStr = selected.toISOString().split('T')[0];
      setSelectedDate(dateStr);
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-6 border-b border-slate-100">
        <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} className="p-2 -ml-2">
                <Menu size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-xl font-black text-slate-800">Penilaian Harian</Text>
            <View className="w-10" />
        </View>
        <Text className="text-slate-400 text-xs mt-1 text-center font-medium">Catat performa tim Anda hari ini</Text>
      </View>

      {showDatePicker && Platform.OS === 'web' && (
          <View className="bg-white p-4 border-b border-slate-100 items-center">
              <TextInput
                  type="date"
                  value={selectedDate}
                  onChangeText={(val) => {
                      setSelectedDate(val);
                      setShowDatePicker(false);
                  }}
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  spellCheck={false}
                  className="bg-slate-100 p-2 rounded-xl w-full text-center font-bold border-0 outline-none"
              />
              <TouchableOpacity onPress={() => setShowDatePicker(false)} className="mt-2">
                  <Text className="text-blue-600 font-bold">Selesai</Text>
              </TouchableOpacity>
          </View>
      )}

      {showDatePicker && Platform.OS !== 'web' && (
          <DateTimePicker
              value={new Date(selectedDate)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={onDateChange}
              maximumDate={new Date()}
          />
      )}

      {/* Date Selector */}
      <View className="bg-white px-6 py-4 border-b border-slate-100">
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
                <CalendarIcon size={16} color="#64748b" />
                <Text className="ml-2 text-slate-800 font-bold text-base">{selectedDate}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className="bg-blue-600 px-4 py-2 rounded-xl shadow-sm shadow-blue-200"
            >
                <Text className="text-white text-xs font-black uppercase">UBAH TANGGAL</Text>
            </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className={`mt-4 flex-row items-center rounded-2xl px-4 py-2 border transition-all ${focusedField === 'search' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-100 border-transparent'}`}>
            <Search size={18} color={focusedField === 'search' ? "#3b82f6" : "#94a3b8"} />
            <TextInput
                className="flex-1 ml-3 text-slate-700 font-medium py-1 border-0 outline-none p-0 bg-transparent"
                placeholder={focusedField === 'search' ? "" : "Cari nama pegawai..."}
                placeholderTextColor="#94a3b8"
                onFocus={() => setFocusedField('search')}
                onBlur={() => setFocusedField(null)}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                spellCheck={false}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <CloseIcon size={18} color="#94a3b8" />
                </TouchableOpacity>
            )}
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} colors={["#0a84ff"]} />}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      >
        {filteredEmployees.length === 0 && !loading ? (
            <View className="items-center justify-center py-20">
                <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                    <User size={40} color="#cbd5e1" />
                </View>
                <Text className="text-slate-400 font-bold text-center">Tidak ada tim yang ditemukan untuk dinilai.</Text>
            </View>
        ) : filteredEmployees.map((emp) => (
          <View key={emp.id} className="bg-white rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center border border-blue-100">
                <Text className="text-blue-600 font-black text-lg">{emp.full_name.charAt(0)}</Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-slate-800 font-bold text-base">{emp.full_name}</Text>
                <Text className="text-slate-400 text-xs font-medium">{emp.position_name}</Text>
              </View>
              {emp.appraisal && (
                  <View className={cn(
                      "px-2 py-1 rounded-lg border",
                      emp.appraisal.rating === 'GOOD' ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                  )}>
                      <Text className={cn(
                          "text-[9px] font-black uppercase",
                          emp.appraisal.rating === 'GOOD' ? "text-green-600" : "text-red-600"
                      )}>{emp.appraisal.rating}</Text>
                  </View>
              )}
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-x-3">
              <TouchableOpacity 
                disabled={submitting === emp.id}
                onPress={() => handleRate(emp.id, 'GOOD', emp.appraisal?.notes || '')}
                className={cn(
                    "flex-1 flex-row items-center justify-center py-3.5 rounded-2xl border transition-all",
                    emp.appraisal?.rating === 'GOOD' 
                        ? "bg-green-500 border-green-600" 
                        : "bg-white border-slate-100 active:bg-slate-50"
                )}
              >
                <ThumbsUp size={16} color={emp.appraisal?.rating === 'GOOD' ? '#fff' : '#10b981'} />
                <Text className={cn(
                    "ml-2 font-black text-[11px] uppercase tracking-wider",
                    emp.appraisal?.rating === 'GOOD' ? "text-white" : "text-green-600"
                )}>GOOD</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                disabled={submitting === emp.id}
                onPress={() => handleRate(emp.id, 'BAD', emp.appraisal?.notes || '')}
                className={cn(
                    "flex-1 flex-row items-center justify-center py-3.5 rounded-2xl border transition-all",
                    emp.appraisal?.rating === 'BAD' 
                        ? "bg-red-500 border-red-600" 
                        : "bg-white border-slate-100 active:bg-slate-50"
                )}
              >
                <ThumbsDown size={16} color={emp.appraisal?.rating === 'BAD' ? '#fff' : '#ef4444'} />
                <Text className={cn(
                    "ml-2 font-black text-[11px] uppercase tracking-wider",
                    emp.appraisal?.rating === 'BAD' ? "text-white" : "text-red-600"
                )}>BAD</Text>
              </TouchableOpacity>
            </View>

            {/* Notes Button */}
            <TouchableOpacity 
                onPress={() => {
                    setActiveNotesId(activeNotesId === emp.id ? null : emp.id);
                    setTempNotes(emp.appraisal?.notes || '');
                }}
                className="mt-3 py-2 px-4 bg-slate-50 rounded-xl flex-row items-center"
            >
                <MessageSquare size={14} color="#64748b" />
                <Text className="ml-2 text-slate-500 text-xs font-medium italic flex-1" numberOfLines={1}>
                    {emp.appraisal?.notes || 'Tambah catatan evaluasi...'}
                </Text>
                {submitting === emp.id ? <ActivityIndicator size="small" color="#0a84ff" /> : <ChevronRight size={14} color="#cbd5e1" />}
            </TouchableOpacity>

            {/* Expanded Notes Input */}
            {activeNotesId === emp.id && (
                <View className={`mt-4 p-4 rounded-3xl border transition-all ${focusedField === `notes-${emp.id}` ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                    <TextInput
                        multiline
                        numberOfLines={3}
                        placeholder={focusedField === `notes-${emp.id}` ? "" : "Apa yang terjadi hari ini? (Hadir tepat waktu, Sering main HP, dll)"}
                        placeholderTextColor="#94a3b8"
                        onFocus={() => setFocusedField(`notes-${emp.id}`)}
                        onBlur={() => setFocusedField(null)}
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                        importantForAutofill="no"
                        spellCheck={false}
                        value={tempNotes}
                        onChangeText={setTempNotes}
                        className="text-slate-700 text-xs font-medium leading-5 border-0 outline-none p-0 bg-transparent"
                        textAlignVertical="top"
                    />
                    <TouchableOpacity 
                        onPress={() => {
                            if (!emp.appraisal?.rating) {
                                Alert.alert('Perhatian', 'Pilih rating (GOOD/BAD) terlebih dahulu sebelum menyimpan catatan.');
                                return;
                            }
                            handleRate(emp.id, emp.appraisal.rating, tempNotes);
                            setActiveNotesId(null);
                        }}
                        className="mt-4 bg-blue-600 py-3 rounded-2xl items-center flex-row justify-center"
                    >
                        <Save size={14} color="#fff" />
                        <Text className="ml-2 text-white font-black text-[10px] uppercase">SIMPAN CATATAN</Text>
                    </TouchableOpacity>
                </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
