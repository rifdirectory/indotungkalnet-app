import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { 
  DrawerContentScrollView, 
} from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { 
  Home, 
  Calendar, 
  ClipboardCheck, 
  LogOut, 
  User, 
  ShieldCheck,
  Clock,
  ChevronRight,
  FileText,
  History,
  LifeBuoy
} from 'lucide-react-native';
import * as SecureStore from '../utils/storage';

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [userPosition, setUserPosition] = useState('');
  const [isPic, setIsPic] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const name = await SecureStore.getItemAsync('user_name');
      const pos = await SecureStore.getItemAsync('user_position');
      const pic = await SecureStore.getItemAsync('user_is_pic');
      if (name) setUserName(name);
      if (pos) setUserPosition(pos);
      if (pic === 'true') setIsPic(true);
    }
    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Keluar Akun",
      "Apakah Anda yakin ingin keluar dari aplikasi ITNET?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all([
                SecureStore.deleteItemAsync('user_name'),
                SecureStore.deleteItemAsync('user_position'),
                SecureStore.deleteItemAsync('user_id'),
                SecureStore.deleteItemAsync('user_is_pic'),
                SecureStore.deleteItemAsync('user_role'),
                SecureStore.deleteItemAsync('user_token'),
                SecureStore.deleteItemAsync('read_notifications')
              ]);
              router.replace('/');
            } catch (e) {
              // Fallback replace
              router.replace('/');
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    { label: 'Dashboard', icon: Home, path: '/home' },
    { label: 'Tiket Support', icon: LifeBuoy, path: '/tickets' },
    { label: 'Tugas Saya', icon: ClipboardCheck, path: '/tasks' },
  ];

  const employeeItems = [
    { label: 'Jadwal Shift', icon: Calendar, path: '/schedule' },
    { label: 'Permohonan Izin', icon: FileText, path: '/leave' },
    { label: 'Riwayat Absen', icon: History, path: '/history' },
  ];

  const managerialItems = [
    { label: 'Persetujuan Izin', icon: ShieldCheck, path: '/approval-leave', hidden: !isPic },
    { label: 'Penugasan Lembur', icon: Clock, path: '/overtime', hidden: !isPic },
    { label: 'Penilaian Harian', icon: FileText, path: '/performance', hidden: !isPic },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Header Profile - Simplest Clean Design */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 40 : 60 }}
        className="px-8 pb-8 border-b border-slate-100"
      >
        <View className="flex-row items-center">
            <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100">
                <User size={24} color="#64748b" />
            </View>
            <View className="ml-4 flex-1">
                <Text className="text-slate-800 text-lg font-bold" numberOfLines={1}>
                    {userName || 'Teknisi ITNET'}
                </Text>
                <View className="flex-row items-center mt-0.5">
                    <Text className="text-slate-400 text-xs font-medium uppercase tracking-tighter">
                        {userPosition || 'Staff'}
                    </Text>
                    {isPic && (
                        <View className="ml-2 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            <Text className="text-blue-600 text-[8px] font-black uppercase">PIC</Text>
                        </View>
                    )}
                </View>
            </View>
            
            <TouchableOpacity 
                onPress={handleLogout}
                className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center border border-red-100 active:bg-red-100"
            >
                <LogOut size={20} color="#ef4444" />
            </TouchableOpacity>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 20 }}>
        <View className="px-6">
          <Text className="text-slate-300 text-[9px] font-black uppercase tracking-[2px] mb-4 ml-2">NAVIGASI UTAMA</Text>
          
          {menuItems.map((item, index) => {
            const isActive = pathname.includes(item.path);
            
            // Skip "Tiket Support" for unauthorized mobile users
            if (item.label === 'Tiket Support') {
              const allowedNames = ['Arifin Ahmad', 'Ria Puspitasari', 'Nurani Mila Utami', 'Wisnu Rachmawan'];
              if (!allowedNames.includes(userName)) return null;
            }

            return (
                <TouchableOpacity
                    key={index}
                    onPress={() => router.push(item.path as any)}
                    className={`flex-row items-center py-4 px-2 rounded-2xl mb-1 ${isActive ? 'bg-blue-50/50' : 'active:bg-slate-50'}`}
                >
                    <item.icon size={20} color={isActive ? '#0a84ff' : '#94a3b8'} strokeWidth={isActive ? 2.5 : 2} />
                    <Text className={`ml-4 flex-1 font-bold text-sm ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                        {item.label}
                    </Text>
                    {isActive && <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />}
                </TouchableOpacity>
            );
          })}

          <View className="h-[1px] bg-slate-50 my-6 mx-2" />

          <Text className="text-slate-300 text-[9px] font-black uppercase tracking-[2px] mb-4 ml-2">PEGAWAI</Text>
          
          {employeeItems.map((item, index) => {
            const isActive = pathname.includes(item.path);
            return (
                <TouchableOpacity
                    key={index}
                    onPress={() => router.push(item.path as any)}
                    className={`flex-row items-center py-4 px-2 rounded-2xl mb-1 ${isActive ? 'bg-blue-50/50' : 'active:bg-slate-50'}`}
                >
                    <item.icon size={20} color={isActive ? '#0a84ff' : '#94a3b8'} strokeWidth={isActive ? 2.5 : 2} />
                    <Text className={`ml-4 flex-1 font-bold text-sm ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                        {item.label}
                    </Text>
                    {isActive && <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />}
                </TouchableOpacity>
            );
          })}

          {isPic && (
            <>
              <View className="h-[1px] bg-slate-50 my-6 mx-2" />
              <Text className="text-slate-300 text-[9px] font-black uppercase tracking-[2px] mb-4 ml-2">MANAJERIAL</Text>
              
              {managerialItems.filter(i => !i.hidden).map((item, index) => {
                const isActive = pathname.includes(item.path);
                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => router.push(item.path as any)}
                        className={`flex-row items-center py-4 px-2 rounded-2xl mb-1 ${isActive ? 'bg-blue-50/50' : 'active:bg-slate-50'}`}
                    >
                        <item.icon size={20} color={isActive ? '#0a84ff' : '#94a3b8'} strokeWidth={isActive ? 2.5 : 2} />
                        <Text className={`ml-4 flex-1 font-bold text-sm ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                            {item.label}
                        </Text>
                        {isActive && <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />}
                    </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>
      </DrawerContentScrollView>

    </View>
  );
}
