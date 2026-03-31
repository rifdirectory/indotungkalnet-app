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
  Info,
  Calendar,
  MapPin,
  ClipboardCheck,
  Clock,
  X
} from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [repairNote, setRepairNote] = useState('');

  const fetchTaskDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks?id=${id}&type=${type}`);
      if (res.data.success) {
        setTask(res.data.data);
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

  useEffect(() => {
    fetchTaskDetail();
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
    in_progress: { label: 'PROSES', color: '#0a84ff', bg: '#eff6ff', icon: <PlayCircle size={16} color="#0a84ff" /> },
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
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 font-bold tracking-tight text-lg ml-2">Detail Penugasan</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View className="flex-row items-center mb-6">
            <View style={{ backgroundColor: statusInfo.bg }} className="px-4 py-1.5 rounded-full flex-row items-center mr-3">
                {statusInfo.icon}
                <Text style={{ color: statusInfo.color }} className="text-xs font-bold ml-2 uppercase tracking-widest">
                    {statusInfo.label}
                </Text>
            </View>
            <View className={isTicket ? "bg-orange-100 px-3 py-1.5 rounded-xl" : "bg-purple-100 px-3 py-1.5 rounded-xl"}>
                <Text className={isTicket ? "text-orange-600 font-bold text-[10px]" : "text-purple-600 font-bold text-[10px]"}>
                    {isTicket ? 'TIKET GANGGUAN' : 'TUGAS MANUAL'}
                </Text>
            </View>
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

        {/* TIM TEKNISI (PIC) */}
        {task.pic_names && (
            <View className="mb-8 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <View className="flex-row items-center mb-3">
                    <User size={18} color="#475569" />
                    <Text className="ml-3 font-bold text-slate-500 text-[10px] uppercase tracking-widest">TIM TEKNISI (PIC)</Text>
                </View>
                <Text className="text-slate-700 font-bold leading-5">{task.pic_names}</Text>
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
              {(task.status.toLowerCase() === 'open' || task.status.toLowerCase() === 'pending') && (
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

            <TextInput
              multiline
              placeholder="Contoh: Ganti dropcore patchcord di FO 3..."
              className="bg-slate-50 border border-slate-100 p-5 rounded-[24px] text-slate-700 h-40 mb-8 font-medium"
              textAlignVertical="top"
              value={repairNote}
              onChangeText={setRepairNote}
            />

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
    </SafeAreaView>
  );
}
