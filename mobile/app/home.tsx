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
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, 
  LogOut, 
  MapPin, 
  Calendar, 
  Clock, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  ClipboardCheck
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = 'http://192.168.1.7:3000/api';

export default function HomeScreen() {
  const router = useRouter();
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
  
  const init = async () => {
    setLoading(true);
    try {
      // 0. Load User Info from SecureStore
      const name = await SecureStore.getItemAsync('user_name');
      const pos = await SecureStore.getItemAsync('user_position');
      const id = await SecureStore.getItemAsync('user_id');
      if (name) setUserName(name);
      if (pos) setUserPosition(pos);
      if (id) setUserId(id);

      // 1. Get Today's Presence Status & Shift
      if (id) {
        try {
          const statusRes = await axios.get(`${API_URL}/presence/current-status?employee_id=${id}`);
          if (statusRes.data.success) {
            const d = statusRes.data.data;
            setUserStatus(d.duration ? `${d.status} (${d.duration})` : d.status);
            setUserStatusColor(d.color || '#6b7280');
            setUserShift(d.shift_name);
            setUserShiftHours(d.shift_hours);
            // Optional: set shift color if backend provides it
          }
        } catch (e) {
          console.error('Status Fetch Error:', e);
        }
      }

      // 2. Get Office Coordinates from Settings API
      const settingsRes = await axios.get(`${API_URL}/settings`);
      if (settingsRes.data.success) {
        setOfficeCoords({
          latitude: parseFloat(settingsRes.data.data.office_latitude),
          longitude: parseFloat(settingsRes.data.data.office_longitude),
          radius: parseInt(settingsRes.data.data.office_radius) || 100
        });
      }

      // 3. Request Location Permission (Don't block app)
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Izin Lokasi tidak diberikan');
          setLocationEnabled(false);
          setIsWithinRadius(false);
        } else {
          setLocationEnabled(true);
          // 4. Get Current Position
          let loc = await Location.getCurrentPositionAsync({});
          setUserLocation(loc.coords);
          
          // Simplified radius check for now
          setIsWithinRadius(true); 
          setDistance(0); 
        }
      } catch (err) {
        console.error('Location error:', err);
        setLocationEnabled(false);
        setIsWithinRadius(false);
      }
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

  useEffect(() => {
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  };

  const handleAttendance = (type: 'clock_in' | 'clock_out') => {
    if (!locationEnabled) {
        Alert.alert('Lokasi Mati', 'Sistem tidak bisa mendeteksi lokasi Anda. Silakan aktifkan GPS dan tekan tarik layar ke bawah untuk menyegarkan.');
        return;
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text className="mt-4 text-gray-500 font-medium">Menyesuaikan Lokasi...</Text>
      </View>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        className="flex-1 px-6 pt-10"
        refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                colors={['#0a84ff']}
            />
        }
      >
        
        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex-row items-center">
            <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mr-4">
                <User size={32} color="#0a84ff" />
            </View>
            <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800">{userName}</Text>
                <Text className="text-gray-500 font-medium">{userPosition}</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/')}>
                <LogOut size={22} color="#ff453a" />
            </TouchableOpacity>
        </View>

        {/* Date & Time Section */}
        <View className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6 items-center">
            <Text className="text-gray-500 font-bold mb-1 uppercase tracking-widest text-xs">WAKTU SEKARANG</Text>
            <Text className="text-5xl font-extrabold text-blue-500 mb-2">
                {currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View className="flex-row items-center">
                <Calendar size={14} color="#6b7280" />
                <Text className="text-gray-500 ml-1.5 font-medium">
                    {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
            </View>
        </View>

        {/* Geofencing Status */}
        <View className={`rounded-3xl p-5 mb-8 flex-row items-center border ${locationEnabled ? (isWithinRadius ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-orange-50 border-orange-200'}`}>
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${locationEnabled ? (isWithinRadius ? 'bg-green-100' : 'bg-red-100') : 'bg-orange-100'}`}>
                <MapPin size={24} color={locationEnabled ? (isWithinRadius ? '#30d158' : '#ff453a') : '#ff9f0a'} />
            </View>
            <View className="flex-1">
                <Text className={`font-bold text-base ${locationEnabled ? (isWithinRadius ? 'text-green-800' : 'text-red-800') : 'text-orange-800'}`}>
                    {locationEnabled ? (isWithinRadius ? 'Dalam Area Kantor' : 'Diluar Area Kantor') : 'Lokasi Tidak Aktif'}
                </Text>
                <Text className={locationEnabled ? (isWithinRadius ? 'text-green-600' : 'text-red-600') : 'text-orange-600'}>
                    {locationEnabled ? (isWithinRadius ? 'Anda dapat melakukan presensi' : 'Dekatkan diri ke kantor') : 'Aktifkan GPS & Tarik Layar untuk Absen'}
                </Text>
            </View>
            {locationEnabled ? (isWithinRadius ? <CheckCircle2 size={24} color="#30d158" /> : <AlertCircle size={24} color="#ff453a" />) : <AlertCircle size={24} color="#ff9f0a" />}
        </View>

        {/* Attendance Actions */}
        <View className="flex-row space-x-4 mb-4">
            <TouchableOpacity 
                onPress={() => handleAttendance('clock_in')}
                className={`flex-1 rounded-3xl p-6 items-center shadow-lg ${locationEnabled ? 'bg-white border border-blue-500 active:bg-blue-50' : 'bg-gray-50 border border-gray-200 opacity-60'}`}
            >
                <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 ${locationEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <Camera size={28} color="white" />
                </View>
                <Text className={`font-bold text-lg ${locationEnabled ? 'text-blue-500' : 'text-gray-400'}`}>Masuk</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => handleAttendance('clock_out')}
                className={`flex-1 rounded-3xl p-6 items-center shadow-md ${locationEnabled ? 'bg-white border border-gray-200 active:bg-gray-50' : 'bg-gray-50 border border-gray-200 opacity-60'}`}
            >
                <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 ${locationEnabled ? 'bg-gray-100' : 'bg-gray-200'}`}>
                    <LogOut size={28} color={locationEnabled ? '#6b7280' : '#d1d5db'} />
                </View>
                <Text className={`font-bold text-lg ${locationEnabled ? 'text-gray-600' : 'text-gray-300'}`}>Pulang</Text>
            </TouchableOpacity>
        </View>

        {/* Leave Request Shortcut */}
        <TouchableOpacity 
            onPress={() => router.push('/leave')}
            className="bg-white rounded-3xl p-5 mb-5 shadow-sm border border-gray-100 flex-row items-center"
        >
            <View className="w-12 h-12 bg-orange-100 rounded-2xl items-center justify-center mr-4">
                <Calendar size={24} color="#f97316" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-base text-gray-800">Ajukan Izin / Cuti</Text>
                <Text className="text-gray-500 text-xs">Sakit, keperluan keluarga, atau libur</Text>
            </View>
            <View className="bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-600 font-bold text-xs">Buka</Text>
            </View>
        </TouchableOpacity>

        {/* My Tasks Shortcut */}
        <TouchableOpacity 
            onPress={() => router.push('/tasks')}
            className="bg-white rounded-3xl p-5 mb-10 shadow-sm border border-gray-100 flex-row items-center"
        >
            <View className="w-12 h-12 bg-purple-100 rounded-2xl items-center justify-center mr-4">
                <ClipboardCheck size={24} color="#a855f7" />
            </View>
            <View className="flex-1">
                <Text className="font-bold text-base text-gray-800">Tugas Saya</Text>
                <Text className="text-gray-500 text-xs">Lihat penugasan dan deadline harian</Text>
            </View>
            <View className="bg-purple-100 px-3 py-1 rounded-full">
                <Text className="text-purple-600 font-bold text-xs">Buka</Text>
            </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Footer Info */}
      <View className="px-8 py-6 bg-white border-t border-gray-100 flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
            <Clock size={16} color={userShiftColor} />
            <View className="ml-2">
                <Text className="text-[10px] text-gray-400 font-bold uppercase">SHIFT HARI INI</Text>
                <Text className="text-xs font-bold text-gray-800" numberOfLines={1}>{userShift} ({userShiftHours})</Text>
            </View>
        </View>
        <Chip label={userStatus} color={userStatusColor} />
      </View>

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
