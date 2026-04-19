import React from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
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
  FileText,
  History,
  LifeBuoy
} from 'lucide-react-native';
import { useUser } from '../context/UserContext';

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout: contextLogout } = useUser();

  const handleLogout = () => {
    const performLogout = async () => {
        try {
            await contextLogout();
            // Force temporary delay to allow Alert/Storage to settle before navigation
            setTimeout(() => {
                router.replace('/');
            }, 100);
        } catch (err) {
            console.error('Logout failed:', err);
            router.replace('/');
        }
    };

    if (Platform.OS === 'web') {
        if (confirm("Apakah Anda yakin ingin keluar dari aplikasi ITNET?")) {
            performLogout();
        }
    } else {
        Alert.alert(
            "Keluar Akun",
            "Apakah Anda yakin ingin keluar dari aplikasi ITNET?",
            [
                { text: "Batal", style: "cancel" },
                { 
                  text: "Keluar", 
                  style: "destructive",
                  onPress: performLogout
                }
            ]
        );
    }
  };

  const menuItems = [
    { key: 'home', label: 'Dashboard', icon: Home, path: '/(drawer)/home' },
    { key: 'tickets', label: 'Tiket Support', icon: LifeBuoy, path: '/(drawer)/tickets' },
    { key: 'tasks', label: 'Tugas Saya', icon: ClipboardCheck, path: '/(drawer)/tasks' },
  ];
  
  const employeeItems = [
    { key: 'schedule', label: 'Jadwal Shift', icon: Calendar, path: '/(drawer)/schedule' },
    { key: 'leave', label: 'Permohonan Izin', icon: FileText, path: '/(drawer)/leave' },
    { key: 'history', label: 'Riwayat Absen', icon: History, path: '/(drawer)/history' },
  ];
  
  const managerialItems = [
    { key: 'approval', label: 'Persetujuan Izin', icon: ShieldCheck, path: '/(drawer)/approval-leave' },
    { key: 'overtime', label: 'Penugasan Lembur', icon: Clock, path: '/(drawer)/overtime' },
    { key: 'performance', label: 'Penilaian Harian', icon: FileText, path: '/(drawer)/performance' },
  ];

  const [allowedKeys, setAllowedKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchPerms = async () => {
        try {
            // We use the same API as Web
            // user.position is used to fetch permissions
            const role = user?.role === 'admin' ? 'admin' : user?.position;
            if (!role) return;

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'}/settings/permissions?role=${role}`);
            const data = await res.json();
            
            if (data.success) {
                if (role === 'admin') {
                    // Admins see everything
                    const allKeys = [...menuItems, ...employeeItems, ...managerialItems].map(i => i.key);
                    setAllowedKeys(allKeys);
                } else {
                    const enabled = data.permissions
                        .filter((p: any) => p.platform === 'mobile' && p.is_enabled === 1)
                        .map((p: any) => p.menu_key);
                    
                    // Default to everything if no records discovered yet (same as Web logic)
                    const hasAnyMobileRecords = data.permissions.some((p: any) => p.platform === 'mobile');
                    const allMobileKeys = [...menuItems, ...employeeItems, ...managerialItems].map(i => i.key);
                    setAllowedKeys(hasAnyMobileRecords ? enabled : allMobileKeys);
                }
            }
        } catch (error) {
            console.error('[Drawer] Permission Check Failed:', error);
            // Fallback to showing everything on error to prevent total lockout
            setAllowedKeys([...menuItems, ...employeeItems, ...managerialItems].map(i => i.key));
        }
    };

    fetchPerms();
  }, [user?.id]);

  const isAllowed = (key: string) => allowedKeys.includes(key);

  const navigateTo = (path: string) => {
    // Jika kita sudah berada di halaman tersebut, cukup tutup drawer
    if (pathname === path) {
        props.navigation.closeDrawer();
        return;
    }

    // Tutup drawer dulu supaya tidak crash di Web (History collision)
    props.navigation.closeDrawer();
    
    // Tunggu animasi tutup selesai baru navigasi menggunakan Replace
    // REPLACE adalah solusi definitif untuk crash dispatchEvent di Web
    setTimeout(() => {
        router.replace(path as any);
    }, 150);
  };

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
                    {user?.name || 'Teknisi ITNET'}
                </Text>
                <View className="flex-row items-center mt-0.5">
                    <Text className="text-slate-400 text-xs font-medium uppercase tracking-tighter">
                        {user?.position || 'Staff'}
                    </Text>
                    {user?.isPic && (
                        <View className="ml-2 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            <Text className="text-blue-600 text-[8px] font-black uppercase">PIC</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 20, paddingBottom: 110 }}>
        <View className="px-6">
          <Text className="text-slate-300 text-[9px] font-black uppercase tracking-[2px] mb-4 ml-2">NAVIGASI UTAMA</Text>
          
          {menuItems.filter(item => isAllowed(item.key)).map((item, index) => {
            const isActive = pathname === item.path;
            
            return (
                <TouchableOpacity
                    key={index}
                    onPress={() => navigateTo(item.path)}
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
          
          {employeeItems.filter(item => isAllowed(item.key)).map((item, index) => {
            const isActive = pathname === item.path;
            return (
                <TouchableOpacity
                    key={index}
                    onPress={() => navigateTo(item.path)}
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

          {user?.isPic && (
            <>
              <View className="h-[1px] bg-slate-50 my-6 mx-2" />
              <Text className="text-slate-300 text-[9px] font-black uppercase tracking-[2px] mb-4 ml-2">MANAJERIAL</Text>
              
          {managerialItems.filter(item => isAllowed(item.key)).map((item, index) => {
            const isActive = pathname === item.path;
            return (
                <TouchableOpacity
                    key={index}
                    onPress={() => navigateTo(item.path)}
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

          <View className="h-[1px] bg-slate-50 my-6 mx-2" />
          
          <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center py-4 px-2 rounded-2xl mb-8 active:bg-red-50"
          >
              <LogOut size={20} color="#ef4444" strokeWidth={2.5} />
              <Text className="ml-4 flex-1 font-bold text-sm text-red-500">
                  Keluar Akun
              </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

    </View>
  );
}
