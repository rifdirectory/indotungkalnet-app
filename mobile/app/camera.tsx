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
import { CameraView, Camera } from 'expo-camera';
// import * as FaceDetector from 'expo-face-detector';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Camera as CameraIcon, CheckCircle2 } from 'lucide-react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.1.7:3000/api';

export default function CameraScreen() {
  const router = useRouter();
  const { type, employee_id, latitude, longitude } = useLocalSearchParams(); 
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleFacesDetected = ({ faces }: any) => {
    if (faces.length > 0 && !processing && !success) {
      const face = faces[0];
      // Face must be large enough in the frame
      if (face.bounds.size.width > width * 0.4) {
        setIsFaceDetected(true);
        // Take picture after a short delay
        const timer = setTimeout(() => {
            if (isFaceDetected && !processing) takePicture();
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else {
      setIsFaceDetected(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || processing || success) return;
    
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        name: 'presence.jpg',
        type: 'image/jpeg'
      } as any);

      // 1. Upload photo to get URL
      const uploadRes = await axios.post(`${API_URL}/presence/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        // 2. Record presence with dynamic data from params
        const presenceRes = await axios.post(`${API_URL}/presence/history`, {
          employee_id: employee_id || 1, 
          type: type,
          photo_url: uploadRes.data.url,
          location_lat: latitude || 0, 
          location_lng: longitude || 0,
          note: 'Absen via Mobile (Face Scan)'
        });

        if (presenceRes.data.success) {
          setSuccess(true);
          setTimeout(() => router.back(), 2000);
        }
      }
    } catch (error: any) {
        Alert.alert('Gagal Absen', error.message || 'Terjadi kesalahan sistem');
        setProcessing(false);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) {
      return (
          <View className="flex-1 items-center justify-center p-10">
              <Text className="text-center mb-6">Aplikasi memerlukan izin kamera untuk scan wajah</Text>
              <TouchableOpacity 
                onPress={async () => {
                    const { status } = await Camera.requestCameraPermissionsAsync();
                    setHasPermission(status === 'granted');
                }} 
                className="bg-blue-500 px-6 py-3 rounded-xl"
              >
                  <Text className="text-white font-bold">Beri Izin</Text>
              </TouchableOpacity>
          </View>
      );
  }

  const CameraViewAny = CameraView as any;

  return (
    <View className="flex-1 bg-black">
      <CameraViewAny 
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        // onFacesDetected={handleFacesDetected}
        // faceDetectorSettings={{
        //   mode: FaceDetector.FaceDetectorMode.fast,
        //   detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        //   runClassifications: FaceDetector.FaceDetectorClassifications.none,
        //   minDetectionInterval: 100,
        //   tracking: true,
        // }}
      />

      {/* Overlay UI */}
      <View style={StyleSheet.absoluteFill} className="items-center justify-between py-16">
        
        {/* Top Header */}
        <View className="flex-row items-center justify-between w-full px-8">
            <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-3 rounded-full">
                <X color="white" />
            </TouchableOpacity>
            <View className="bg-white/20 px-6 py-2 rounded-full border border-white/30">
                <Text className="text-white font-bold tracking-widest text-xs">SCAN WAJAH ITNET</Text>
            </View>
            <View className="w-12 h-12" />
        </View>

        {/* Circular Guide Overlay */}
        <View className={`w-72 h-72 rounded-full border-4 items-center justify-center ${isFaceDetected ? 'border-green-500' : 'border-white/50'}`}>
            {!isFaceDetected && !processing && !success && (
                <Text className="text-white bg-black/50 px-4 py-2 rounded-full text-xs font-bold">POSISIKAN WAJAH DI SINI</Text>
            )}
            
            {processing && (
                <View className="bg-black/60 p-6 rounded-3xl items-center">
                    <ActivityIndicator color="white" size="large" />
                    <Text className="text-white font-bold mt-3">SEDANG PROSES...</Text>
                </View>
            )}

            {success && (
                <View className="bg-green-500/90 p-8 rounded-full items-center">
                    <CheckCircle2 color="white" size={60} />
                    <Text className="text-white font-bold mt-2">BERHASIL!</Text>
                </View>
            )}

            {!processing && !success && (
                <TouchableOpacity 
                    onPress={takePicture}
                    className="absolute bottom-[-100px] bg-white w-20 h-20 rounded-full items-center justify-center border-4 border-blue-500 shadow-xl"
                >
                    <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center">
                        <CameraIcon color="white" size={32} />
                    </View>
                </TouchableOpacity>
            )}
        </View>

        {/* Footer Instructions */}
        <View className="items-center px-10">
            <View className={`px-6 py-4 rounded-3xl flex-row items-center border ${isFaceDetected ? 'bg-green-500/20 border-green-500' : 'bg-white/10 border-white/20'}`}>
                <CameraIcon color={isFaceDetected ? '#22c55e' : 'white'} size={24} />
                <View className="ml-4">
                    <Text className="text-white font-bold">{success ? 'Absensi Tercatat' : (isFaceDetected ? 'Wajah Terdeteksi' : 'Mencari Wajah...')}</Text>
                    <Text className="text-white/60 text-xs">Pastikan pencahayaan cukup terang</Text>
                </View>
            </View>
        </View>

      </View>
    </View>
  );
}
