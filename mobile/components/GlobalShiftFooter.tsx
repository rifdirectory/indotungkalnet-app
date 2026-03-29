import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Clock, Calendar } from 'lucide-react-native';
import axios from 'axios';
import { usePathname } from 'expo-router';

import { API_URL } from '../services/api';

export default function GlobalShiftFooter() {
    const pathname = usePathname();
    const [shift, setShift] = useState<string>('Memuat...');
    const [hours, setHours] = useState<string>('00:00 - 00:00');
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    const fetchStatus = async () => {
        try {
            const id = await SecureStore.getItemAsync('user_id');
            if (!id) {
                setIsVisible(false); // Hide on login screen
                return;
            }
            setIsVisible(true);

            const res = await axios.get(`${API_URL}/presence/current-status?employee_id=${id}`);
            if (res.data.success) {
                setShift(res.data.data.shift_name || 'Normal');
                setHours(res.data.data.shift_hours || '08:00 - 17:00');
            }
        } catch (error) {
            console.error('[Footer] Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        
        // Polling status secara halus (1 menit sekali)
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, [pathname]); // Refresh saat pindah halaman

    if (!isVisible || pathname === '/') return null;

    return (
        <View 
            style={{ 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 35, // High elevation for Android visibility
            }}
            className="bg-white border-t border-slate-100 px-6 py-4 flex-row items-center justify-between"
        >
            <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mr-3 border border-blue-100">
                    <Clock size={18} color="#0a84ff" />
                </View>
                <View>
                    <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-3">SHIFT SAAT INI</Text>
                    <Text className="text-slate-800 text-sm font-bold mt-0.5 leading-4">{shift}</Text>
                </View>
            </View>

            <View className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Text className="text-slate-500 font-black text-[10px] tracking-tight">{hours}</Text>
            </View>
        </View>
    );
}
