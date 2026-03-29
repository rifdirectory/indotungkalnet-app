// Reload Trigger: 2026-03-30 03:56
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { 
  User, 
  LogOut, 
  MapPin, 
  Calendar, 
  Clock, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  ClipboardCheck,
  Menu
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../services/api';
import axios from 'axios';
import { DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

// Konfigurasi API - Sekarang diambil secara dinamis dari services/api.js

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [userName, setUserName] = useState<string>('Memuat...');
  const [userPosition, setUserPosition] = useState<string>('Memuat...');
  const [userStatus, setUserStatus] = useState<string>('BELUM ABSEN');
  const [userStatusColor, setUserStatusColor] = useState<string>('#6b7280');
  const [userShift, setUserShift] = useState<string>('Normal');
  const [userShiftHours, setUserShiftHours] = useState<string>('08:00 - 17:00');
  const [userShiftColor, setUserShiftColor] = useState<string>('#0a84ff');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [officeCoords, setOfficeCoords] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isWithinRadius, setIsWithinRadius] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userId, setUserId] = useState<string | null>(null);
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [hasClockedOut, setHasClockedOut] = useState(false);
  const [canClockOut, setCanClockOut] = useState(false);
  const [shiftEnd, setShiftEnd] = useState('16:00');
  
  const calculateDistance = (currentCoords: any, targetCoords: any) => {
    if (!currentCoords || !targetCoords) return;
    const R = 6371e3; // metres
    const φ1 = currentCoords.latitude * Math.PI/180;
    const φ2 = targetCoords.latitude * Math.PI/180;
    const Δφ = (targetCoords.latitude-currentCoords.latitude) * Math.PI/180;
    const Δλ = (targetCoords.longitude-currentCoords.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    setDistance(Math.round(d));
    setIsWithinRadius(d <= targetCoords.radius);
  };

  const syncLocation = async (targetCoords: any) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationEnabled(false);
        setIsWithinRadius(false);
        return;
      }
      setLocationEnabled(true);

      // 1. Instant: Get last known position
      const lastLoc = await Location.getLastKnownPositionAsync({});
      if (lastLoc) {
        setUserLocation(lastLoc.coords);
        if (targetCoords) calculateDistance(lastLoc.coords, targetCoords);
      }

      // 2. Background: Get accurate position with 10s timeout
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      if (currentLoc) {
        setUserLocation(currentLoc.coords);
        if (targetCoords) calculateDistance(currentLoc.coords, targetCoords);
      }
    } catch (err) {
      console.error('Location sync error:', err);
    }
  };

  const init = async () => {
    setLoading(true);
    try {
      // 1. Fundamental user data
      const [name, pos, id] = await Promise.all([
        SecureStore.getItemAsync('user_name'),
        SecureStore.getItemAsync('user_position'),
        SecureStore.getItemAsync('user_id')
      ]);
      
      if (name) setUserName(name);
      if (pos) setUserPosition(pos);
      if (id) setUserId(id);

      // 2. Critical API Data (Settings & Status)
      const [settingsRes, statusRes] = await Promise.all([
        axios.get(`${API_URL}/settings`).catch(() => null),
        id ? axios.get(`${API_URL}/presence/current-status?employee_id=${id}`).catch(() => null) : null
      ]);

      // Parse Settings
      let targetCoords = null;
      if (settingsRes?.data?.success) {
        targetCoords = {
          latitude: parseFloat(settingsRes.data.data.office_latitude),
          longitude: parseFloat(settingsRes.data.data.office_longitude),
          radius: parseInt(settingsRes.data.data.office_radius) || 100
        };
        setOfficeCoords(targetCoords);
      } else {
        targetCoords = { latitude: -0.816431, longitude: 103.468202, radius: 100 };
        setOfficeCoords(targetCoords);
      }

      // Parse Status
      if (statusRes?.data?.success) {
        const d = statusRes.data.data;
        setHasClockedIn(d.has_clocked_in);
        setHasClockedOut(d.has_clocked_out);
        setCanClockOut(d.can_clock_out);
        setShiftEnd(d.shift_end?.substring(0, 5) || '17:00');
        setUserStatus(d.status);
        setUserStatusColor(d.color || '#6b7280');
        setUserShift(d.shift_name);
        setUserShiftHours(d.shift_hours);
      }

      // 3. Kick off Location in background (Don't await fully to speed up UI)
      syncLocation(targetCoords);

    } catch (error) {
      console.error('Init Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      init();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  };

  const handleAttendance = (type: 'clock_in' | 'clock_out') => {
    if (!locationEnabled) {
        Alert.alert('Lokasi Mati', 'Sistem tidak bisa mendeteksi lokasi Anda. Silakan aktifkan GPS dan tarik layar untuk menyegarkan.');
        return;
    }

    if (!isWithinRadius) {
        Alert.alert('Diluar Area', `Maaf, Anda berada ${distance}m dari kantor. Radius maksimal adalah ${officeCoords?.radius}m.`);
        return;
    }

    if (type === 'clock_in' && hasClockedIn) {
        Alert.alert('Status: Sudah Absen', 'Sistem mendeteksi Anda sudah melakukan absen masuk hari ini.');
        return;
    }

    if (type === 'clock_out' && !hasClockedIn) {
        Alert.alert('Status: Belum Absen', 'Sistem mendeteksi Anda belum melakukan absen masuk. Silakan absen masuk terlebih dahulu.');
        return;
    }

    if (type === 'clock_out' && !canClockOut) {
        Alert.alert('Belum Waktunya Pulang', `Shift Anda hari ini berakhir jam ${shiftEnd}. Silakan kembali lagi nanti.`);
        return;
    }

    if ((type === 'clock_in' && hasClockedIn) || (type === 'clock_out' && hasClockedOut)) {
        return; // Antispam guard
    }
    
    // Navigasi ke kamera dengan parameter tipe absen dan koordinat
    router.push({ 
        pathname: '/camera', 
        params: { 
            type, 
            employee_id: userId,
            latitude: userLocation?.latitude,
            longitude: userLocation?.longitude
        } 
    });
  };

  const getStatusColor = () => {
    return userStatus === 'Hadir' ? '#10b981' : (userStatus.includes('Terlambat') ? '#f43f5e' : '#64748b');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text className="mt-4 text-gray-500 font-medium">Menyesuaikan Lokasi...</Text>
      </View>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Top Navbar - Added Android Padding Offset */}
      <View 
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10 }}
        className="px-6 pb-4 bg-white border-b border-slate-100 flex-row items-center justify-between z-10"
      >
        <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            className="p-2"
        >
            <Menu size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 text-lg font-extrabold tracking-tight text-center flex-1">{userName}</Text>
        <TouchableOpacity className="p-2">
            <User size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        <View className="px-6 pt-4" />

        {/* Status Section - Simple Linear List */}
        <View className="px-6 mb-8">
            <View className={`rounded-2xl p-5 border ${locationEnabled ? (isWithinRadius ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100') : 'bg-amber-50 border-amber-100'}`}>
                <View className="flex-row items-center mb-1">
                    <MapPin size={16} color={locationEnabled ? (isWithinRadius ? '#10b981' : '#f43f5e') : '#f59e0b'} />
                    <Text className={`text-[10px] font-bold uppercase ml-2 tracking-widest ${locationEnabled ? (isWithinRadius ? 'text-emerald-600' : 'text-rose-600') : 'text-amber-600'}`}>
                        Lokasi Anda
                    </Text>
                </View>
                <Text className={`text-lg font-bold ${locationEnabled ? (isWithinRadius ? 'text-emerald-800' : 'text-rose-800') : 'text-amber-800'}`}>
                    {locationEnabled ? (isWithinRadius ? 'Dalam Area Kantor' : 'Diluar Area') : 'GPS Tidak Aktif'}
                </Text>
                <Text className={`text-xs opacity-70 ${locationEnabled ? (isWithinRadius ? 'text-emerald-600' : 'text-rose-600') : 'text-amber-600'}`}>
                    Status: {userStatus}
                </Text>
            </View>
        </View>

        {/* Buttons - Solid and Clear */}
        <View className="px-6 flex-row space-x-4 mb-8">
            <TouchableOpacity 
                onPress={() => handleAttendance('clock_in')}
                disabled={hasClockedIn}
                className={`flex-1 h-32 rounded-3xl items-center justify-center ${locationEnabled && !hasClockedIn ? 'bg-blue-600' : 'bg-slate-100'}`}
            >
                <Camera size={32} color={locationEnabled && !hasClockedIn ? 'white' : '#cbd5e1'} />
                <Text className={`font-bold mt-2 ${locationEnabled && !hasClockedIn ? 'text-white' : 'text-slate-400'}`}>
                    {hasClockedIn ? 'SUDAH ABSEN' : 'ABSEN MASUK'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => handleAttendance('clock_out')}
                disabled={hasClockedOut || !hasClockedIn || !canClockOut}
                style={{ opacity: (hasClockedOut || !hasClockedIn || !canClockOut) ? 0.3 : 1 }}
                className={`flex-1 h-32 rounded-3xl items-center justify-center border ${hasClockedOut || !hasClockedIn || !canClockOut ? 'bg-slate-300 border-slate-400' : 'bg-white border-slate-200'}`}
            >
                <LogOut size={32} color={hasClockedOut || !hasClockedIn || !canClockOut ? '#64748b' : '#64748b'} />
                <Text className={`font-bold mt-2 text-center px-1 text-[11px] ${hasClockedOut || !hasClockedIn || !canClockOut ? 'text-slate-600' : 'text-slate-600'}`}>
                    {hasClockedOut ? 'SUDAH PULANG' : (!hasClockedIn ? 'BELUM MASUK' : (!canClockOut ? `JAM ${shiftEnd}` : 'ABSEN PULANG'))}
                </Text>
            </TouchableOpacity>
        </View>

        {/* Shortcut Actions */}
        <View className="px-6 pb-24 flex-row justify-between">
            <TouchableOpacity 
                onPress={() => router.push('/tasks')}
                className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center mr-2"
            >
                <ClipboardCheck size={20} color="#3b82f6" />
                <Text className="font-bold text-slate-700 ml-3 text-sm">Tugas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.push('/leave')}
                className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center ml-2"
            >
                <Calendar size={20} color="#3b82f6" />
                <Text className="font-bold text-slate-700 ml-3 text-sm">Izin</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, color }: { label: string, color?: string }) {
    return (
        <View style={{ backgroundColor: (color || '#0a84ff') + '15' }} className="px-4 py-1.5 rounded-full">
            <Text style={{ color: color || '#0a84ff' }} className="font-bold text-[10px] uppercase tracking-tighter">{label}</Text>
        </View>
    );
}
