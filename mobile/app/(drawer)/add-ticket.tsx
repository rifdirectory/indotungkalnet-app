import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { 
  ArrowLeft, 
  Save, 
  Search, 
  User, 
  Info,
  ChevronDown,
  Check,
  AlertCircle
} from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function AddTicketScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Form States
  const [customer, setCustomer] = useState<any>(null);
  const [category, setCategory] = useState('Gangguan');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number[]>([]);
  
  // Data States
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, empRes] = await Promise.all([
          axios.get(`${API_URL}/customers`),
          axios.get(`${API_URL}/employees?status=active`)
        ]);
        
        if (custRes.data.success) setCustomers(custRes.data.data);
        if (empRes.data.success) setEmployees(empRes.data.data.filter((e: any) => e.position_id !== null)); // Only real employees
      } catch (e) {
        console.error('Fetch Error:', e);
      } finally {
        setInitLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!customer && !category.includes('baru')) {
      Alert.alert('Eror', 'Harap pilih pelanggan terlebih dahulu.');
      return;
    }
    if (!description) {
      Alert.alert('Eror', 'Harap isi deskripsi keluhan.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: customer?.id || customer?.name, // Handles custom name for Maintenance
        category,
        priority,
        description,
        assigned_to: assignedTo,
        status: 'Open'
      };

      const res = await axios.post(`${API_URL}/support`, payload);
      if (res.data.success) {
        Alert.alert('Berhasil', 'Tiket support berhasil dibuat.');
        router.back();
      } else {
        Alert.alert('Gagal', res.data.message || 'Terjadi kesalahan saat menyimpan tiket.');
      }
    } catch (error: any) {
      Alert.alert('Kesalahan Sistem', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.pppoe_username?.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  if (initLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0a84ff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-4 bg-white border-b border-slate-50 flex-row items-center justify-between"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 text-lg font-extrabold tracking-tight">Buat Tiket Baru</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={loading}
          className="bg-blue-600 px-4 py-2 rounded-xl flex-row items-center justify-center"
        >
          {loading ? <ActivityIndicator size="small" color="white" /> : (
            <>
              <Save size={16} color="white" />
              <Text className="text-white font-bold ml-2">SIMPAN</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          
          {/* Customer Selection */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Pelanggan</Text>
            <TouchableOpacity 
              onPress={() => setShowCustomerPicker(!showCustomerPicker)}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <Search size={18} color="#64748b" />
                <Text className={`ml-3 font-bold ${customer ? 'text-slate-800' : 'text-slate-400'}`}>
                  {customer ? customer.full_name : 'Cari Nama Pelanggan...'}
                </Text>
              </View>
              <ChevronDown size={20} color="#94a3b8" />
            </TouchableOpacity>

            {showCustomerPicker && (
              <View className="mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-hidden">
                <View className="p-3 border-b border-slate-50">
                  <TextInput 
                    className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold"
                    placeholder="Ketik nama atau ID..."
                    value={searchCustomer}
                    onChangeText={setSearchCustomer}
                  />
                </View>
                <ScrollView nestedScrollEnabled className="flex-1">
                  {filteredCustomers.map((c) => (
                    <TouchableOpacity 
                      key={c.id}
                      onPress={() => {
                        setCustomer(c);
                        setShowCustomerPicker(false);
                      }}
                      className="p-4 border-b border-slate-50 flex-row items-center justify-between"
                    >
                      <View>
                        <Text className="font-bold text-slate-800">{c.full_name}</Text>
                        <Text className="text-[10px] text-slate-400 font-medium">#{c.id} - {c.pppoe_username || 'No PPPoE'}</Text>
                      </View>
                      {customer?.id === c.id && <Check size={18} color="#0a84ff" />}
                    </TouchableOpacity>
                  ))}
                  {/* Option for custom maintenance name */}
                  <TouchableOpacity 
                    onPress={() => {
                      setCustomer({ id: null, full_name: searchCustomer, name: searchCustomer });
                      setShowCustomerPicker(false);
                    }}
                    className="p-4 bg-blue-50/50"
                  >
                    <Text className="text-blue-600 font-bold text-xs italic">Cari: "{searchCustomer}" (Pilih sebagai nama manual)</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Category & Priority */}
          <View className="flex-row mb-6 space-x-4">
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Kategori</Text>
              <View className="bg-slate-100 rounded-2xl p-1 flex-row">
                {['Gangguan', 'Bantuan'].map(cat => (
                  <TouchableOpacity 
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`flex-1 py-3 items-center rounded-xl ${category === cat ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`text-[11px] font-black ${category === cat ? 'text-blue-600' : 'text-slate-400'}`}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Prioritas</Text>
              <View className="bg-slate-100 rounded-2xl p-1 flex-row">
                {['Normal', 'Urgent'].map(p => (
                  <TouchableOpacity 
                    key={p}
                    onPress={() => setPriority(p)}
                    className={`flex-1 py-3 items-center rounded-xl ${priority === p ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`text-[11px] font-black ${priority === p ? (p === 'Urgent' ? 'text-red-500' : 'text-blue-600') : 'text-slate-400'}`}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Keluhan / Masalah</Text>
            <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-[120px]">
              <TextInput 
                multiline
                className="text-slate-800 font-bold leading-5"
                placeholder="Tuliskan detail keluhan di sini..."
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Technician Assignment */}
          <View className="mb-8">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Tugaskan Teknisi</Text>
            <TouchableOpacity 
              onPress={() => setShowEmployeePicker(!showEmployeePicker)}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <User size={18} color="#64748b" />
                <Text className={`ml-3 font-bold ${assignedTo.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                  {assignedTo.length > 0 ? `${assignedTo.length} Terpilih` : 'Pilih Teknisi...'}
                </Text>
              </View>
              <ChevronDown size={20} color="#94a3b8" />
            </TouchableOpacity>

            {showEmployeePicker && (
              <View className="mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-hidden">
                <ScrollView nestedScrollEnabled>
                  {employees.map((e) => (
                    <TouchableOpacity 
                      key={e.id}
                      onPress={() => {
                        if (assignedTo.includes(e.id)) {
                          setAssignedTo(assignedTo.filter(id => id !== e.id));
                        } else {
                          setAssignedTo([...assignedTo, e.id]);
                        }
                      }}
                      className="p-4 border-b border-slate-50 flex-row items-center justify-between"
                    >
                      <View>
                        <Text className="font-bold text-slate-800">{e.full_name}</Text>
                        <Text className="text-[10px] text-slate-400 font-medium">{e.position_name}</Text>
                      </View>
                      {assignedTo.includes(e.id) && <Check size={18} color="#0a84ff" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <View className="flex-row flex-wrap mt-2">
                {assignedTo.map(id => {
                    const emp = employees.find(e => e.id === id);
                    if (!emp) return null;
                    return (
                        <View key={id} className="bg-blue-50 px-3 py-1.5 rounded-full mr-2 mb-2 border border-blue-100">
                             <Text className="text-blue-600 text-[10px] font-bold uppercase">{emp.full_name}</Text>
                        </View>
                    );
                })}
                {assignedTo.length === 0 && (
                  <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                    <Info size={12} color="#d97706" />
                    <Text className="text-amber-600 text-[10px] font-bold uppercase ml-2">OTOMATIS (SISTEM)</Text>
                  </View>
                )}
            </View>
          </View>

          <View className="pb-32" />
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}
