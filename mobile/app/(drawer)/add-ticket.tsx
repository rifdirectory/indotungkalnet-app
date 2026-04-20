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
  AlertCircle,
  X
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
  const [targetLocation, setTargetLocation] = useState(''); // Only for Pemasangan Baru
  const [category, setCategory] = useState('Perbaikan');
  const [priority, setPriority] = useState('Medium');
  const [difficulty, setDifficulty] = useState('Low');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number[]>([]);
  
  // Costs
  const [fuelCost, setFuelCost] = useState('0');
  const [materialCost, setMaterialCost] = useState('0');
  const [otherCost, setOtherCost] = useState('0');
  
  // Data States
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, empRes] = await Promise.all([
          axios.get(`${API_URL}/customers`),
          axios.get(`${API_URL}/employees?range=today`)
        ]);
        
        if (custRes.data.success) setCustomers(custRes.data.data);
        if (empRes.data.success) {
          const techList = empRes.data.data.filter((e: any) => 
            (e.position_name?.toLowerCase().includes('teknisi') || 
             e.position_name?.toLowerCase().includes('noc')) && 
            e.current_status !== 'Off' &&
            e.current_status !== 'Izin'
          );
          setEmployees(techList);
        }
      } catch (e) {
        console.error('Fetch Error:', e);
      } finally {
        setInitLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    const isNewInstall = category === 'Pemasangan Baru';
    
    if (!isNewInstall && !customer) {
      Alert.alert('Eror', 'Harap pilih pelanggan terlebih dahulu.');
      return;
    }
    if (isNewInstall && !targetLocation) {
      Alert.alert('Eror', 'Harap isi Nama / Target Lokasi pemasangan.');
      return;
    }
    if (!description) {
      Alert.alert('Eror', 'Harap isi deskripsi keluhan.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: isNewInstall ? targetLocation : customer.id,
        category,
        priority,
        difficulty,
        phone_number: phoneNumber || (customer?.phone_number ?? ''),
        description,
        assigned_to: assignedTo,
        fuel_cost: Number(fuelCost),
        material_cost: Number(materialCost),
        other_cost: Number(otherCost),
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
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(drawer)/tickets');
            }
          }} 
          className="p-2 -ml-2"
        >
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
          
          {/* Category Selector */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Kategori Layanan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {["Pemasangan Baru", "Perbaikan", "Perubahan Paket", "Pelanggan Berhenti"].map(cat => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`mr-2 px-4 py-2.5 rounded-xl border ${category === cat ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-100'}`}
                >
                  <Text className={`text-[11px] font-bold ${category === cat ? 'text-white' : 'text-slate-500'}`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Customer Selection or Target Location */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">
              {category === 'Pemasangan Baru' ? 'Nama / Target Lokasi' : 'Pelanggan'}
            </Text>
            
            {category === 'Pemasangan Baru' ? (
              <View className={`border rounded-2xl p-4 flex-row items-center transition-all ${focusedField === 'targetLoc' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                <Search size={18} color={focusedField === 'targetLoc' ? "#3b82f6" : "#64748b"} />
                <TextInput 
                  className="ml-3 flex-1 font-bold text-slate-800 border-0 outline-none p-0 bg-transparent"
                  placeholder={focusedField === 'targetLoc' ? "" : "Contoh: Perum. Indah Blok A / Tiang 4"}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setFocusedField('targetLoc')}
                  onBlur={() => setFocusedField(null)}
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  spellCheck={false}
                  value={targetLocation}
                  onChangeText={setTargetLocation}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  onPress={() => setShowCustomerPicker(!showCustomerPicker)}
                  className={`border rounded-2xl p-4 flex-row items-center justify-between ${showCustomerPicker ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}
                >
                  <View className="flex-row items-center flex-1">
                    <Search size={18} color={showCustomerPicker ? "#3b82f6" : "#64748b"} />
                    <Text className={`ml-3 font-bold ${customer ? 'text-slate-800' : 'text-slate-400'}`}>
                      {customer ? customer.full_name : 'Cari Nama Pelanggan...'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={showCustomerPicker ? "#3b82f6" : "#94a3b8"} />
                </TouchableOpacity>

                {showCustomerPicker && (
                  <View className="mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-hidden">
                    <View className="p-3 border-b border-slate-50">
                      <TextInput 
                        className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold border-0 outline-none"
                        placeholder={focusedField === 'searchCust' ? "" : "Ketik nama atau ID..."}
                        placeholderTextColor="#94a3b8"
                        onFocus={() => setFocusedField('searchCust')}
                        onBlur={() => setFocusedField(null)}
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                        importantForAutofill="no"
                        spellCheck={false}
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
                            setPhoneNumber(c.phone_number || '');
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
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Phone Number */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Nomor HP / WhatsApp (Opsional)</Text>
            <View className={`border rounded-2xl p-4 flex-row items-center transition-all ${focusedField === 'phone' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <Info size={18} color={focusedField === 'phone' ? "#3b82f6" : "#64748b"} />
              <TextInput 
                className="ml-3 flex-1 font-bold text-slate-800 border-0 outline-none p-0 bg-transparent"
                placeholder={focusedField === 'phone' ? "" : "0812xxxx"}
                placeholderTextColor="#94a3b8"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                spellCheck={false}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>

          {/* Priority & Difficulty */}
          <View className="flex-row mb-6 space-x-4">
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Prioritas</Text>
              <View className="bg-slate-100 rounded-2xl p-1 flex-row">
                {['High', 'Medium', 'Low'].map(p => (
                  <TouchableOpacity 
                    key={p}
                    onPress={() => setPriority(p)}
                    className={`flex-1 py-3 items-center rounded-xl ${priority === p ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`text-[10px] font-black ${priority === p ? (p === 'High' ? 'text-red-500' : 'text-blue-600') : 'text-slate-400'}`}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Kesulitan</Text>
              <View className="bg-slate-100 rounded-2xl p-1 flex-row">
                {['High', 'Medium', 'Low'].map(d => (
                  <TouchableOpacity 
                    key={d}
                    onPress={() => setDifficulty(d)}
                    className={`flex-1 py-3 items-center rounded-xl ${difficulty === d ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`text-[10px] font-black ${difficulty === d ? 'text-orange-600' : 'text-slate-400'}`}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Detail Keluhan / Masalah</Text>
            <View className={`border rounded-2xl p-4 min-h-[120px] transition-all ${focusedField === 'desc' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <TextInput 
                multiline
                className="text-slate-800 font-bold leading-5 border-0 outline-none p-0 bg-transparent"
                placeholder={focusedField === 'desc' ? "" : "Tuliskan detail keluhan di sini..."}
                placeholderTextColor="#94a3b8"
                onFocus={() => setFocusedField('desc')}
                onBlur={() => setFocusedField(null)}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                spellCheck={false}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Operational Costs */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Estimasi Biaya Operasional (Rp)</Text>
            <View className="flex-row space-x-2">
              <View className={`flex-1 border rounded-2xl p-3 transition-all ${focusedField === 'fuel' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                <Text className={`text-[9px] font-bold mb-1 uppercase ${focusedField === 'fuel' ? 'text-blue-500' : 'text-slate-400'}`}>Bensin</Text>
                <TextInput 
                  keyboardType="numeric"
                  className="text-slate-800 font-bold text-sm border-0 outline-none p-0 bg-transparent"
                  placeholder={focusedField === 'fuel' ? "" : "0"}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setFocusedField('fuel')}
                  onBlur={() => setFocusedField(null)}
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  spellCheck={false}
                  value={fuelCost}
                  onChangeText={setFuelCost}
                />
              </View>
              <View className={`flex-1 border rounded-2xl p-3 transition-all ${focusedField === 'mat' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                <Text className={`text-[9px] font-bold mb-1 uppercase ${focusedField === 'mat' ? 'text-blue-500' : 'text-slate-400'}`}>Material</Text>
                <TextInput 
                  keyboardType="numeric"
                  className="text-slate-800 font-bold text-sm border-0 outline-none p-0 bg-transparent"
                  placeholder={focusedField === 'mat' ? "" : "0"}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setFocusedField('mat')}
                  onBlur={() => setFocusedField(null)}
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  spellCheck={false}
                  value={materialCost}
                  onChangeText={setMaterialCost}
                />
              </View>
              <View className={`flex-1 border rounded-2xl p-3 transition-all ${focusedField === 'oth' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                <Text className={`text-[9px] font-bold mb-1 uppercase ${focusedField === 'oth' ? 'text-blue-500' : 'text-slate-400'}`}>Lainnya</Text>
                <TextInput 
                  keyboardType="numeric"
                  className="text-slate-800 font-bold text-sm border-0 outline-none p-0 bg-transparent"
                  placeholder={focusedField === 'oth' ? "" : "0"}
                  placeholderTextColor="#94a3b8"
                  onFocus={() => setFocusedField('oth')}
                  onBlur={() => setFocusedField(null)}
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  spellCheck={false}
                  value={otherCost}
                  onChangeText={setOtherCost}
                />
              </View>
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
                        setShowEmployeePicker(false);
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
                        <View key={id} className="bg-blue-50 px-3 py-1.5 rounded-xl mr-2 mb-2 border border-blue-100 flex-row items-center">
                             <Text className="text-blue-600 text-[10px] font-black uppercase">{emp.full_name}</Text>
                             <TouchableOpacity 
                              onPress={() => setAssignedTo(assignedTo.filter(aid => aid !== id))}
                              className="ml-2 bg-blue-100/50 p-0.5 rounded-md"
                             >
                                <X size={10} color="#2563eb" strokeWidth={3} />
                             </TouchableOpacity>
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
