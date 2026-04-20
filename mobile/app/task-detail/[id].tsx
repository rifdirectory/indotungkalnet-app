import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  CheckCircle2, 
  PlayCircle, 
  AlertCircle,
  MessageCircle,
  User,
  Users,
  Info,
  Calendar,
  MapPin,
  ClipboardCheck,
  Clock,
  Search,
  X,
  Edit2,
  DollarSign,
  Flag,
  ShieldAlert,
  Wrench,
  WrenchIcon
} from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../../services/api';
import { useUser } from '../../context/UserContext';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id, type, source } = useLocalSearchParams();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [repairNote, setRepairNote] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [techs, setTechs] = useState<any[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([]);
  const [searchTech, setSearchTech] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  const { user } = useUser();

  const fetchTaskDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks?id=${id}&type=${type}`);
      if (res.data.success) {
        setTask(res.data.data);
        if (res.data.data.assigned_ids) {
          const ids = res.data.data.assigned_ids.split(',').map((i: string) => parseInt(i)).filter((id: number) => !isNaN(id));
          setSelectedAssignees(ids);
        }
      } else {
        Alert.alert('Eror', 'Tugas tidak ditemukan');
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Eror', 'Gagal memuat detail tugas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get(`${API_URL}/employees/technicians?use_presence=true`);
      if (res.data.success) {
        setTechs(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Technicians Error:', err);
    }
  };

  useEffect(() => {
    fetchTaskDetail();
    fetchTechnicians();
  }, [id, type]);

  const updateStatus = async (newStatus: string, note?: string) => {
    if (!task) return;
    try {
      const res = await axios.patch(`${API_URL}/tasks`, { 
        id: task.id, 
        status: newStatus, 
        type: task.type,
        note: note || null
      });
      if (res.data.success) {
        setShowCompletionModal(false);
        setRepairNote('');
        fetchTaskDetail(); // Refresh local data
      }
    } catch (error) {
      Alert.alert('Eror', 'Gagal memperbarui status tugas');
    }
  };

  const handleAssignment = async () => {
    if (!task || type !== 'ticket') return;
    setAssigning(true);
    try {
      const res = await axios.put(`${API_URL}/support/${id}`, {
        ...task,
        assigned_to: selectedAssignees
      });
      if (res.data.success) {
        Alert.alert('Sukses', 'Tim teknisi berhasil diperbarui');
        setShowAssignModal(false);
        fetchTaskDetail();
      } else {
        throw new Error(res.data.message || 'Gagal update assignment');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error updating assignment';
      Alert.alert('Gagal Update', msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(source === 'tasks' ? '/(drawer)/tasks' : '/(drawer)/tickets');
    }
  };

  const handleOpenWhatsApp = (info: string) => {
    const match = info.match(/\b08\d{8,12}\b/);
    if (match) {
      let number = match[0];
      if (number.startsWith('0')) number = '62' + number.substring(1);
      const url = `https://wa.me/${number}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Eror', 'Tidak dapat membuka WhatsApp');
      });
    } else {
      Alert.alert('Info', 'Nomor telepon tidak ditemukan');
    }
  };

  const statusMap: any = {
    completed: { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} color="#16a34a" /> },
    selesai: { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} color="#16a34a" /> },
    closed: { label: 'DITUTUP', color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle2 size={16} color="#16a34a" /> },
    resolved: { label: 'VERIFIKASI', color: '#a855f7', bg: '#f3e8ff', icon: <Clock size={16} color="#a855f7" /> },
    'sudah diperbaiki': { label: 'VERIFIKASI', color: '#a855f7', bg: '#f3e8ff', icon: <Clock size={16} color="#a855f7" /> },
    in_progress: { label: 'PROSES', color: '#0a84ff', bg: '#eff6ff', icon: <PlayCircle size={16} color="#0a84ff" /> },
    'sedang dikerjakan': { label: 'PROSES', color: '#0a84ff', bg: '#eff6ff', icon: <PlayCircle size={16} color="#0a84ff" /> },
    otw: { label: 'OTW', color: '#f97316', bg: '#fff7ed', icon: <MapPin size={16} color="#f97316" /> },
    dibatalkan: { label: 'DIBATALKAN', color: '#ef4444', bg: '#fee2e2', icon: <X size={16} color="#ef4444" /> }
  };

  const getStatusInfo = (status: string) => {
    return statusMap[status.toLowerCase()] || { label: 'MENUNGGU', color: '#d97706', bg: '#fffbeb', icon: <Clock size={16} color="#d97706" /> };
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#0a84ff" size="large" />
      </View>
    );
  }

  if (!task) return null;

  const statusInfo = getStatusInfo(task.status);
  const isTicket = task.type === 'ticket';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Dynamic Header */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-4 bg-white border-b border-slate-100 flex-row items-center z-10"
      >
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 font-bold tracking-tight text-lg ml-2">Detail Penugasan</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View className="flex-row items-center mb-6">
            {/* Status Badge */}
            <View style={{ backgroundColor: statusInfo.bg }} className="px-4 py-1.5 rounded-full flex-row items-center mr-3">
                {statusInfo.icon}
                <Text style={{ color: statusInfo.color }} className="text-xs font-bold ml-2 uppercase tracking-widest">
                    {statusInfo.label}
                </Text>
            </View>

            {/* Type Badge (Only for Manual Tasks) */}
            {!isTicket && (
              <View className="bg-purple-100 px-3 py-1.5 rounded-xl">
                  <Text className="text-purple-600 font-bold text-[10px]">TUGAS MANUAL</Text>
              </View>
            )}
        </View>

        {/* Profile Card - Simplified */}
        <View className="bg-slate-50 p-6 rounded-3xl mb-6 items-center border border-slate-100">
          <Text className="text-xl font-bold text-slate-800 text-center leading-7">
            {isTicket ? (task.customer_name || 'Pelanggan Umum') : task.title}
          </Text>
          {isTicket && task.phone_number && (
              <TouchableOpacity 
                onPress={() => handleOpenWhatsApp(task.phone_number)}
                className="flex-row items-center mt-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100"
              >
                <MessageCircle size={14} color="#059669" />
                <Text className="text-emerald-700 font-bold ml-2 text-sm">{task.phone_number}</Text>
              </TouchableOpacity>
          )}
        </View>

        {/* TICKET DETAILS (CATEGORY, PRIORITY, DIFFICULTY) */}
        {task.type === 'ticket' && (
          <View className="flex-row flex-wrap mb-6">
            <View className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex-row items-center mr-3 mb-3">
              <Wrench size={14} color="#2563eb" />
              <View className="ml-2">
                <Text className="text-[8px] text-blue-400 font-black uppercase">KATEGORI</Text>
                <Text className="text-blue-700 font-bold text-[11px]">{task.category || 'Perbaikan'}</Text>
              </View>
            </View>
            
            <View className={`${task.priority === 'High' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'} px-4 py-2 rounded-2xl border flex-row items-center mr-3 mb-3`}>
              <ShieldAlert size={14} color={task.priority === 'High' ? "#ef4444" : "#f59e0b"} />
              <View className="ml-2">
                <Text className={`text-[8px] ${task.priority === 'High' ? 'text-red-400' : 'text-orange-400'} font-black uppercase`}>PRIORITAS</Text>
                <Text className={`font-bold text-[11px] ${task.priority === 'High' ? 'text-red-700' : 'text-orange-700'}`}>{task.priority || 'Medium'}</Text>
              </View>
            </View>

            <View className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex-row items-center mb-3">
              <Flag size={14} color="#475569" />
              <View className="ml-2">
                <Text className="text-[8px] text-slate-400 font-black uppercase">KESULITAN</Text>
                <Text className="text-slate-700 font-bold text-[11px]">{task.difficulty || 'Low'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* TIM TEKNISI (PIC) */}
        {task.type === 'ticket' && (
            <View className="mb-8 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <Users size={18} color="#475569" />
                        <Text className="ml-3 font-bold text-slate-500 text-[10px] uppercase tracking-widest">TIM TEKNISI (PIC)</Text>
                    </View>
                    {(user?.isPic || user?.role === 'admin') && source !== 'tasks' && (
                        <TouchableOpacity 
                            onPress={() => setShowAssignModal(true)}
                            className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex-row items-center"
                        >
                            <Edit2 size={12} color="#2563eb" />
                            <Text className="text-blue-600 font-bold text-[10px] ml-1.5 uppercase">Pilih / Ubah</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text className="text-slate-700 font-bold leading-5">{task.pic_names || 'Belum Ada Teknisi'}</Text>
            </View>
        )}

        {/* Status Banner for Completed */}
        {['resolved', 'completed', 'closed', 'selesai'].includes(task.status.toLowerCase()) && (
          <View className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex-row items-center mb-8">
            <CheckCircle2 size={24} color="#059669" />
            <View className="ml-4 flex-1">
                <Text className="text-emerald-800 font-black text-xs uppercase tracking-widest">LAPORAN SELESAI</Text>
                <Text className="text-emerald-600 text-[10px] font-bold mt-0.5">Tiket telah diperbaiki dan menunggu verifikasi Admin.</Text>
            </View>
          </View>
        )}

        {/* Content Rows */}
        <View className="space-y-8 pb-32">
          {/* Deskripsi */}
          <View>
            <View className="flex-row items-center mb-3">
              <Info size={18} color="#0a84ff" />
              <Text className="ml-3 font-bold text-slate-400 text-[10px] uppercase tracking-widest">DESKRIPSI / KELUHAN</Text>
            </View>
            <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <Text className="text-slate-700 leading-6 font-medium">
                    {task.description || 'Tidak ada deskripsi tambahan.'}
                </Text>
            </View>
          </View>


          {/* Repair Note */}
          {task.repair_description && (
            <View>
              <View className="flex-row items-center mb-3">
                <ClipboardCheck size={18} color="#059669" />
                <Text className="ml-3 font-bold text-emerald-600/60 text-[10px] uppercase tracking-widest">KETERANGAN TEKNISI</Text>
              </View>
              <View className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50">
                <Text className="text-emerald-800 font-bold italic line-through-none">" {task.repair_description} "</Text>
              </View>
            </View>
          )}

          {/* Operational Costs */}
          {task.type === 'ticket' && source !== 'tasks' && (
            <View>
              <View className="flex-row items-center mb-3">
                <DollarSign size={18} color="#0a84ff" />
                <Text className="ml-3 font-bold text-slate-400 text-[10px] uppercase tracking-widest">BIAYA OPERASIONAL (ESTIMASI)</Text>
              </View>
              <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-[9px] text-slate-400 font-bold uppercase mb-1">Bensin</Text>
                  <Text className="text-slate-800 font-black">Rp {(task.fuel_cost || 0).toLocaleString('id-ID')}</Text>
                </View>
                <View className="w-[1px] h-full bg-slate-200 mx-4" />
                <View className="items-center flex-1">
                  <Text className="text-[9px] text-slate-400 font-bold uppercase mb-1">Material</Text>
                  <Text className="text-slate-800 font-black">Rp {(task.material_cost || 0).toLocaleString('id-ID')}</Text>
                </View>
                <View className="w-[1px] h-full bg-slate-200 mx-4" />
                <View className="items-center flex-1">
                  <Text className="text-[9px] text-slate-400 font-bold uppercase mb-1">Lainnya</Text>
                  <Text className="text-slate-800 font-black">Rp {(task.other_cost || 0).toLocaleString('id-ID')}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Tanggal */}
          <View>
            <View className="flex-row items-center mb-3">
              <Calendar size={18} color="#0a84ff" />
              <Text className="ml-3 font-bold text-slate-400 text-[10px] uppercase tracking-widest">BATAS WAKTU (DUE DATE)</Text>
            </View>
            <View className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <Text className="text-slate-700 font-bold">
                {task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FIXED FOOTER ACTIONS */}
      {!['resolved', 'completed', 'closed', 'selesai'].includes(task.status.toLowerCase()) && (
        <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-2xl">
          <View className="flex-row items-center space-x-3">
              {/* Cancel Button */}
              {(task.status.toLowerCase() === 'open' || task.status.toLowerCase() === 'pending') && source !== 'tasks' && (
                  <TouchableOpacity 
                      onPress={() => {
                        Alert.alert(
                          'Batal Tugas',
                          'Apakah Anda yakin ingin membatalkan tugas ini?',
                          [
                            { text: 'Tidak', style: 'cancel' },
                            { text: 'Ya, Batal', style: 'destructive', onPress: () => updateStatus('Dibatalkan') }
                          ]
                        );
                      }}
                      className="bg-slate-50 h-16 px-6 rounded-3xl items-center flex-row justify-center border border-slate-200"
                  >
                      <X size={20} color="#ef4444" />
                      <Text className="text-red-500 font-black ml-2 uppercase tracking-tight text-[10px]">Batal</Text>
                  </TouchableOpacity>
              )}

              {/* OTW Button */}
              {(task.status.toLowerCase() === 'open' || task.status.toLowerCase() === 'pending') && isTicket && (
                  <TouchableOpacity 
                      onPress={() => updateStatus('OTW')}
                      className="flex-1 bg-orange-500 h-16 rounded-3xl items-center flex-row justify-center shadow-lg shadow-orange-500/30"
                  >
                      <MapPin size={22} color="white" />
                      <Text className="text-white font-black ml-3 tracking-widest">OTW</Text>
                  </TouchableOpacity>
              )}

              {/* Start Working Button */}
              {(task.status.toLowerCase() === 'otw' || (!isTicket && (task.status.toLowerCase() === 'open' || task.status.toLowerCase() === 'pending'))) && (
                  <TouchableOpacity 
                      onPress={() => updateStatus('in_progress')}
                      className="flex-1 bg-blue-600 h-16 rounded-3xl items-center flex-row justify-center shadow-lg shadow-blue-600/30"
                  >
                      <PlayCircle size={22} color="white" />
                      <Text className="text-white font-black ml-3 tracking-widest">KERJAKAN</Text>
                  </TouchableOpacity>
              )}

              {/* Finish Button */}
              {(task.status.toLowerCase() === 'in_progress' || task.status.toLowerCase() === 'sedang dikerjakan') && (
                  <TouchableOpacity 
                      onPress={() => setShowCompletionModal(true)}
                      className="flex-1 bg-emerald-600 h-16 rounded-3xl items-center flex-row justify-center shadow-lg shadow-emerald-600/30"
                  >
                      <CheckCircle2 size={22} color="white" />
                      <Text className="text-white font-black ml-3 tracking-widest uppercase">SELESAI</Text>
                  </TouchableOpacity>
              )}
          </View>
        </View>
      )}

      {/* COMPLETION MODAL */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="bg-white w-full rounded-[40px] p-8 shadow-2xl">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-emerald-100 rounded-[20px] items-center justify-center mb-4">
                <ClipboardCheck size={32} color="#059669" />
              </View>
              <Text className="text-2xl font-black text-slate-800">Laporan Selesai</Text>
              <Text className="text-slate-500 text-center mt-2 leading-5 font-medium">Mohon isi keterangan perbaikan untuk menutup tiket ini.</Text>
            </View>

            <View className={`p-5 rounded-[24px] border mb-8 h-40 transition-all ${focusedField === 'repair' ? 'bg-white border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <TextInput
                multiline
                placeholder={focusedField === 'repair' ? "" : "Contoh: Ganti dropcore patchcord di FO 3..."}
                placeholderTextColor="#94a3b8"
                onFocus={() => setFocusedField('repair')}
                onBlur={() => setFocusedField(null)}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                spellCheck={false}
                className="text-slate-700 font-medium flex-1 leading-5 border-0 outline-none p-0 bg-transparent"
                textAlignVertical="top"
                value={repairNote}
                onChangeText={setRepairNote}
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity 
                onPress={() => {
                    setShowCompletionModal(false);
                    setRepairNote('');
                }}
                className="flex-1 bg-slate-100 py-5 rounded-[20px] items-center"
              >
                <Text className="text-slate-600 font-bold uppercase tracking-widest text-xs">Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  if (!repairNote.trim()) {
                    Alert.alert('Eror', 'Keterangan perbaikan wajib diisi');
                    return;
                  }
                  updateStatus(task.type === 'ticket' ? 'Resolved' : 'completed', repairNote);
                }}
                className="flex-1 bg-emerald-600 py-5 rounded-[20px] items-center shadow-lg shadow-emerald-100"
              >
                <Text className="text-white font-black uppercase tracking-widest text-xs">Simpan & Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ASSIGN TECHNICIAN MODAL */}
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-end">
          <View className="bg-white w-full rounded-t-[40px] p-8 shadow-2xl h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-2xl font-black text-slate-800">Assign Teknisi</Text>
                    <Text className="text-slate-500 font-medium">Pilih teknisi yang akan bertugas</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAssignModal(false)} className="bg-slate-100 p-2 rounded-full">
                    <X size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            {/* Search Tech */}
            <View className={`flex-row items-center rounded-2xl px-4 py-3 mb-6 border transition-all ${focusedField === 'searchTech' ? 'bg-white border-blue-500 shadow-sm' : 'bg-slate-100 border-transparent'}`}>
                <Search size={18} color={focusedField === 'searchTech' ? "#3b82f6" : "#94a3b8"} />
                <TextInput 
                    className="flex-1 ml-3 text-slate-700 font-medium border-0 outline-none p-0 bg-transparent"
                    placeholder="Cari nama teknisi..."
                    placeholderTextColor="#94a3b8"
                    onFocus={() => setFocusedField('searchTech')}
                    onBlur={() => setFocusedField(null)}
                    value={searchTech}
                    onChangeText={setSearchTech}
                />
            </View>

            <ScrollView className="flex-1 mb-6" showsVerticalScrollIndicator={false}>
                {techs.filter(t => t.full_name.toLowerCase().includes(searchTech.toLowerCase())).map(t => {
                    const isSelected = selectedAssignees.includes(t.id);
                    return (
                        <TouchableOpacity 
                            key={t.id}
                            onPress={() => {
                                if (isSelected) {
                                    setSelectedAssignees(selectedAssignees.filter(id => id !== t.id));
                                } else {
                                    setSelectedAssignees([...selectedAssignees, t.id]);
                                }
                            }}
                            className={`flex-row items-center p-4 rounded-2xl mb-3 border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}
                        >
                            <View className={`w-10 h-10 rounded-xl items-center justify-center ${isSelected ? 'bg-blue-600' : 'bg-slate-100'}`}>
                                <User size={20} color={isSelected ? "white" : "#64748b"} />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{t.full_name}</Text>
                                <Text className="text-slate-400 text-xs">{t.position_name}</Text>
                            </View>
                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                                {isSelected && <CheckCircle2 size={14} color="white" />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View className="flex-row space-x-3">
              <TouchableOpacity 
                disabled={assigning}
                onPress={() => setShowAssignModal(false)}
                className="flex-1 bg-slate-100 py-5 rounded-[20px] items-center"
              >
                <Text className="text-slate-600 font-bold uppercase tracking-widest text-xs">Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={assigning}
                onPress={handleAssignment}
                className="flex-1 bg-blue-600 py-5 rounded-[20px] items-center shadow-lg shadow-blue-100"
              >
                {assigning ? (
                    <ActivityIndicator color="white" size="small" />
                ) : (
                    <Text className="text-white font-black uppercase tracking-widest text-xs">Simpan Assignment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
