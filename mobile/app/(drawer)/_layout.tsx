import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { View, Platform } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { usePathname } from 'expo-router';

import CustomDrawerContent from '../../components/CustomDrawerContent';
import GlobalShiftFooter from '../../components/GlobalShiftFooter';

export default function DrawerLayout() {
  
  return (
    <View style={{ flex: 1, position: 'relative' }}>
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'slide',
                overlayColor: 'rgba(0,0,0,0.5)',
                drawerStyle: {
                    width: '80%',
                    backgroundColor: '#fff',
                },
            }}
        >
            <Drawer.Screen 
                name="home" 
                options={{ 
                    drawerLabel: 'Dashboard',
                    title: 'Dashboard'
                }} 
            />
            <Drawer.Screen 
                name="performance" 
                options={{ 
                    drawerLabel: 'Penilaian Harian',
                    title: 'Penilaian Kinerja'
                }} 
            />
            <Drawer.Screen 
                name="tasks" 
                options={{ 
                    drawerLabel: 'Tugas Saya',
                    title: 'Tugas Saya'
                }} 
            />
            <Drawer.Screen 
                name="schedule" 
                options={{ 
                    drawerLabel: 'Jadwal Shift',
                    title: 'Jadwal Shift'
                }} 
            />
            <Drawer.Screen 
                name="leave" 
                options={{ 
                    drawerLabel: 'Permohonan Izin',
                    title: 'Permohonan Izin'
                }} 
            />
            <Drawer.Screen 
                name="history" 
                options={{ 
                    drawerLabel: 'Riwayat Absen',
                    title: 'Riwayat Absen'
                }} 
            />
            <Drawer.Screen 
                name="approval-leave" 
                options={{ 
                    drawerLabel: 'Persetujuan Izin',
                    title: 'Persetujuan Izin'
                }} 
            />
            <Drawer.Screen 
                name="overtime" 
                options={{ 
                    drawerLabel: 'Penugasan Lembur',
                    title: 'Penugasan Lembur'
                }} 
            />
            <Drawer.Screen 
                name="tickets" 
                options={{ 
                    drawerLabel: 'Tiket Support',
                    title: 'Tiket Support'
                }} 
            />
            <Drawer.Screen 
                name="add-ticket" 
                options={{ 
                    drawerLabel: 'Buat Tiket Baru',
                    title: 'Buat Tiket Baru',
                    drawerItemStyle: { display: 'none' } // Hidden from drawer menu, accessible via navigation
                }} 
            />
        </Drawer>
        
        {/* Persistent Shift Footer Navbar */}
        <GlobalShiftFooter />
    </View>
  );
}
