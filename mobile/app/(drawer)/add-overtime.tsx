import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  User, 
  Calendar, 
  FileText,
  Search,
  Check,
  ChevronRight
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function AddOvertimeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingTechnicians, setFetchingTechnicians] = useState(true);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTechModal, setShowTechModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: 'Pilih Teknisi',
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '60',
    task_desc: '',
    ticket_id: ''
  });

  useEffect(() => {
    async function init() {
      const id = await SecureStore.getItemAsync('user_id');
      if (id) {
        setUserId(id);
        fetchTechnicians(id);
      }
    }
    init();
  }, []);

  const fetchTechnicians = async (empId?: string) => {
    try {
      const id = empId || userId;
      if (!id) return;
      const res = await axios.get(`${API_URL}/employees/technicians?use_presence=true&supervisor_id=${id}`);
      if (res.data.success) {
        setTechnicians(res.data.data);
        setFilteredTechnicians(res.data.data);
      }
    } catch (error) {
      console.error('Fetch Tech Error:', error);
    } finally {
      setFetchingTechnicians(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = technicians.filter(t => 
      t.full_name.toLowerCase().includes(query.toLowerCase()) || 
      t.employee_code.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTechnicians(filtered);
  };

  const selectTechnician = (tech: any) => {
    setFormData({
      ...formData,
      employee_id: tech.id,
      employee_name: tech.full_name
    });
    setShowTechModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.employee_id) {
      Alert.alert('Gagal', 'Silakan pilih teknisi terlebih dahulu.');
      return;
    }
    if (!formData.duration_minutes || parseInt(formData.duration_minutes) <= 0) {
      Alert.alert('Gagal', 'Silakan isi durasi lembur yang valid.');
      return;
    }
    if (!formData.task_desc) {
      Alert.alert('Gagal', 'Silakan isi deskripsi tugas lembur.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/presence/overtime`, {
        employee_id: formData.employee_id,
        pic_id: userId,
        date: formData.date,
        duration_minutes: parseInt(formData.duration_minutes),
        task_desc: formData.task_desc,
        ticket_id: formData.ticket_id || null
      });

      if (res.data.success) {
        Alert.alert('Berhasil', 'Penugasan lembur berhasil dibuat.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Add Overtime Error:', error);
      Alert.alert('Error', 'Gagal membuat penugasan. Pastikan data benar.');
    } finally {
      setLoading(false);
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
        <Text className="text-slate-800 font-bold tracking-tight text-lg">Buat Penugasan</Text>
        <View className="w-10" />
      </View>
 
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
        {/* Technician Selection */}
        <Text className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-[10px]">TEKNISI / PEGAWAI</Text>
        <TouchableOpacity 
            onPress={() => setShowTechModal(true)}
            className="flex-row items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6"
        >
            <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-4">
                <User size={20} color="#0a84ff" />
            </View>
            <Text className={`flex-1 font-bold ${formData.employee_id ? 'text-gray-800' : 'text-gray-400'}`}>
                {formData.employee_name}
            </Text>
            <ChevronRight size={20} color="#d1d5db" />
        </TouchableOpacity>

        {/* Date & Duration */}
        <View className="flex-row space-x-4 mb-6">
            <View className="flex-1">
                <Text className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-[10px]">TANGGAL LEMBUR</Text>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row items-center">
                    <Calendar size={18} color="#6b7280" />
                    <TextInput 
                        value={formData.date}
                        onChangeText={(t) => setFormData({ ...formData, date: t })}
                        placeholder="YYYY-MM-DD"
                        className="ml-3 font-bold text-gray-800 flex-1"
                    />
                </View>
            </View>
            <View className="flex-1">
                <Text className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-[10px]">DURASI (MENIT)</Text>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row items-center">
                    <Clock size={18} color="#6b7280" />
                    <TextInput 
                        value={formData.duration_minutes}
                        onChangeText={(t) => setFormData({ ...formData, duration_minutes: t })}
                        keyboardType="numeric"
                        placeholder="60"
                        className="ml-3 font-bold text-gray-800 flex-1"
                    />
                </View>
            </View>
        </View>

        {/* Task Description */}
        <Text className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-[10px]">DESKRIPSI TUGAS</Text>
        <View className="bg-gray-50 p-4 rounded-3xl border border-gray-100 mb-10 h-32">
            <TextInput 
                multiline
                placeholder="Tuliskan detail tugas lembur di sini..."
                className="font-medium text-gray-800 flex-1"
                textAlignVertical="top"
                value={formData.task_desc}
                onChangeText={(t) => setFormData({ ...formData, task_desc: t })}
            />
        </View>

        {/* Action Button */}
        <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className={`bg-blue-600 p-5 rounded-3xl items-center shadow-lg flex-row justify-center ${loading ? 'opacity-70' : ''}`}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <FileText size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-3">Kirim Penugasan</Text>
                </>
            )}
        </TouchableOpacity>
        
        </View>
      </ScrollView>

      {/* Technician Selection Modal */}
      <Modal
        visible={showTechModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-[40px] h-[80%] px-6 pt-8">
                <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-2xl font-bold">Pilih Teknisi</Text>
                    <TouchableOpacity onPress={() => setShowTechModal(false)} className="p-2 bg-gray-100 rounded-full">
                        <Check size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-row items-center mb-6">
                    <Search size={20} color="#9ca3af" />
                    <TextInput 
                        placeholder="Cari nama atau ID..."
                        className="ml-3 font-medium text-gray-800 flex-1"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>

                {fetchingTechnicians ? (
                    <ActivityIndicator size="large" color="#0a84ff" className="mt-10" />
                ) : (
                    <FlatList 
                        data={filteredTechnicians}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                onPress={() => selectTechnician(item)}
                                className={`flex-row items-center p-4 mb-3 rounded-2xl border ${formData.employee_id === item.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-100'}`}
                            >
                                <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-4 border border-gray-100">
                                    <User size={24} color={formData.employee_id === item.id ? "#0a84ff" : "#d1d5db"} />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-800">{item.full_name}</Text>
                                    <Text className="text-gray-400 text-xs font-medium">{item.position_name} • {item.employee_code}</Text>
                                </View>
                                {formData.employee_id === item.id && <Check size={20} color="#0a84ff" />}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <View className="mt-10 items-center">
                                <Text className="text-gray-400 font-medium">Technician not found</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
