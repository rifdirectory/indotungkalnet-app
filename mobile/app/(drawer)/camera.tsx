import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { X, Camera as CameraIcon, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { API_URL } from '../../services/api';
import axios from 'axios';

const { width } = Dimensions.get('window');

type CameraStatus = 'initializing' | 'ready' | 'processing' | 'success' | 'error';

export default function CameraScreen() {
  const router = useRouter();
  const { type, employee_id, latitude, longitude } = useLocalSearchParams(); 
  
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<CameraStatus>('initializing');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState(4); // 4 seconds fallback
  const [errorMessage, setErrorMessage] = useState('');
  
  const cameraRef = useRef<any>(null);
  const isCapturing = useRef(false);
  const faceDetectionTimer = useRef<NodeJS.Timeout | null>(null);
  const navigationTimer = useRef<NodeJS.Timeout | null>(null);

  const takePicture = async () => {
    // If already processing or succeeded, don't capture again
    if (!cameraRef.current || isCapturing.current || status === 'success') return;
    
    isCapturing.current = true;
    setStatus('processing');
    setErrorMessage('');

    try {
      // 1. Capture Photo
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 0.5,
        base64: false,
        skipProcessing: true // Faster capture
      });
      
      if (!photo?.uri) throw new Error('Gagal mengambil gambar');

      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        name: 'presence.jpg',
        type: 'image/jpeg'
      } as any);

      // 2. Upload Photo (with 15s timeout)
      const uploadRes = await axios.post(`${API_URL}/presence/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000
      });

      if (!uploadRes.data.success) {
        throw new Error(uploadRes.data.message || 'Gagal mengunggah foto');
      }

      // 3. Record Presence (Ensure numeric types)
      const empId = parseInt(String(employee_id || 1));
      const lat = parseFloat(String(latitude || 0));
      const lng = parseFloat(String(longitude || 0));

      const presenceRes = await axios.post(`${API_URL}/presence/history`, {
        employee_id: empId, 
        type: type,
        photo_url: uploadRes.data.url,
        location_lat: lat, 
        location_lng: lng,
        note: 'Absen via Mobile (Face Scan)'
      }, { timeout: 10000 });

      if (presenceRes.data.success) {
        setStatus('success');
        isCapturing.current = false; // Reset for next time
        
        // Absolute navigation to purge state and force refresh
        navigationTimer.current = setTimeout(() => {
            setStatus('initializing'); // Purge just before leave
            router.replace('/(drawer)/home' as any);
        }, 900); // Faster 0.9s transition
      } else {
        throw new Error(presenceRes.data.message || 'Gagal menyimpan presensi');
      }

    } catch (error: any) {
      console.error('Capture Error:', error);
      setErrorMessage(error.message || 'Terjadi kesalahan sistem');
      setStatus('error');
      isCapturing.current = false;
      
      // Auto-retry after 3s if error
      setTimeout(() => {
          // @ts-ignore - Avoid overlap lint error in catch block
          if (status !== 'success') {
              setStatus('ready');
              setCountdown(4); // Reset countdown
          }
      }, 3000);
    }
  };

  // Auto-capture fallback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'ready' && !isCapturing.current) {
        timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    takePicture();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (permission === null) {
        requestPermission();
    } else if (permission.granted) {
        setStatus('ready');
    }
  }, [permission]);

  // Absolute status reset whenever the screen gets focus
  useFocusEffect(
    React.useCallback(() => {
        // Force cleanup of any lingering state
        setStatus('initializing');
        setIsFaceDetected(false);
        setCountdown(4);
        isCapturing.current = false;
        setErrorMessage('');
        
        // Ensure camera re-readies when permission is there
        if (permission?.granted) {
            setStatus('ready');
        }

        return () => {
            if (faceDetectionTimer.current) clearTimeout(faceDetectionTimer.current);
            if (navigationTimer.current) clearTimeout(navigationTimer.current);
            isCapturing.current = false;
        };
    }, [permission])
  );

  const handleFacesDetected = ({ faces }: any) => {
    // If not ready or already doing something, ignore
    if (status !== 'ready' || isCapturing.current) return;

    if (faces.length > 0) {
      const face = faces[0];
      // Face must be large enough (at least 40% of screen width)
      if (face.bounds.size.width > width * 0.4) {
        if (!isFaceDetected) {
            setIsFaceDetected(true);
            // Schedule capture if face stays detected
            if (faceDetectionTimer.current) clearTimeout(faceDetectionTimer.current);
            faceDetectionTimer.current = setTimeout(() => {
                takePicture();
            }, 1000); // 1.0s for quicker response
        }
        return;
      }
    }
    
    // If no face or face too small/far
    if (isFaceDetected) {
        setIsFaceDetected(false);
        if (faceDetectionTimer.current) clearTimeout(faceDetectionTimer.current);
    }
  };

  if (permission === null) {
      return (
        <View className="flex-1 bg-black items-center justify-center">
            <ActivityIndicator color="white" size="large" />
        </View>
      );
  }

  if (!permission.granted) {
      return (
          <View className="flex-1 items-center justify-center p-10 bg-white">
              <AlertCircle size={64} color="#ef4444" />
              <Text className="text-center mt-6 text-slate-800 font-bold text-lg">Izin Kamera Dibutuhkan</Text>
              <Text className="text-center mb-8 text-slate-500">Aplikasi memerlukan izin kamera untuk melakukan absen scan wajah.</Text>
              <TouchableOpacity onPress={requestPermission} className="bg-blue-600 px-8 py-3 rounded-2xl">
                  <Text className="text-white font-bold">Beri Izin</Text>
              </TouchableOpacity>
          </View>
      );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header Controls */}
      <View className="absolute top-12 left-0 right-0 z-20 px-6 flex-row justify-between items-center">
        <TouchableOpacity 
            onPress={() => router.back()}
            className="w-12 h-12 bg-black/40 rounded-full items-center justify-center"
        >
            <X color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Scan Wajah</Text>
        <View className="w-12" />
      </View>

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        // @ts-ignore - Prop exists in library but may have type mismatch in local env
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'none',
          runClassifications: 'none',
          minDetectionInterval: 100,
          tracking: true,
        }}
      />

      {/* Overlay - Scanning Frame */}
      <View className="flex-1 items-center justify-center">
        <View className="w-72 h-96 border-2 border-white/30 rounded-[40px] items-center justify-center overflow-hidden">
            {status === 'processing' && (
                <View className="bg-white/90 p-10 rounded-3xl items-center w-64 shadow-2xl">
                    <ActivityIndicator color="#3b82f6" size="large" />
                    <Text className="text-slate-800 font-bold mt-4 text-center">Sedang Memproses...</Text>
                    <Text className="text-slate-400 text-[10px] mt-1">Jangan pindahkan kamera</Text>
                </View>
            )}

            {status === 'success' && (
                <View className="bg-emerald-500 p-8 rounded-3xl items-center w-64 shadow-2xl">
                    <CheckCircle2 color="white" size={64} />
                    <Text className="text-white font-bold mt-4 text-center text-lg">Absensi Berhasil!</Text>
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="mt-6 bg-white/20 px-6 py-2 rounded-xl"
                    >
                        <Text className="text-white font-bold">Selesai</Text>
                    </TouchableOpacity>
                </View>
            )}

            {status === 'error' && (
                <View className="bg-rose-500 p-6 rounded-3xl items-center w-64 shadow-2xl">
                    <AlertCircle color="white" size={48} />
                    <Text className="text-white font-bold mt-2 text-center text-sm">{errorMessage}</Text>
                    <Text className="text-white/80 text-[10px] mt-2">Mencoba kembali...</Text>
                </View>
            )}
            
            {status === 'ready' && (
                <TouchableOpacity 
                    onPress={takePicture}
                    disabled={isCapturing.current}
                    className="absolute bottom-[-100px] bg-white w-20 h-20 rounded-full items-center justify-center border-4 border-blue-500 shadow-2xl"
                >
                    <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center">
                        <CameraIcon color="white" size={32} />
                    </View>
                </TouchableOpacity>
            )}
        </View>

        {/* Footer Instructions */}
        <View className="items-center px-10 mt-12">
            <View className={`px-6 py-4 rounded-3xl flex-row items-center border ${isFaceDetected ? 'bg-green-500/30 border-green-500' : 'bg-white/10 border-white/20'}`}>
                <CameraIcon color={isFaceDetected ? '#22c55e' : 'white'} size={24} />
                <View className="ml-4">
                    <Text className="text-white font-bold">
                        {status === 'success' ? 'Presensi Tercatat' : (isFaceDetected ? 'Wajah Terdeteksi' : (status === 'ready' ? `Auto-capture: ${countdown}s` : 'Mencari Wajah...'))}
                    </Text>
                    <Text className="text-white/60 text-[10px]">
                        {isFaceDetected ? 'Tahan posisi Anda sebentar' : 'Tingkatkan pencahayaan jika perlu'}
                    </Text>
                </View>
            </View>
        </View>

      </View>
    </View>
  );
}
