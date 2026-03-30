import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform, DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Clock, Calendar } from 'lucide-react-native';
import axios from 'axios';
import { usePathname } from 'expo-router';

import { API_URL } from '../services/api';

export default function GlobalShiftFooter() {
    const pathname = usePathname();
    const [shift, setShift] = useState<string>('Memuat...');
    const [hours, setHours] = useState<string>('00:00 - 00:00');
    const [isOnLeave, setIsOnLeave] = useState(false);
    const [leaveType, setLeaveType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const id = await SecureStore.getItemAsync('user_id');
            if (!id) {
                setIsVisible(false); // Hide on login screen
                return;
            }
            setIsVisible(true);

            const res = await axios.get(`${API_URL}/presence/current-status?employee_id=${id}`);
            if (res.data.success) {
                const d = res.data.data;
                setShift(d.shift_name || 'Normal');
                setHours(d.shift_hours || '08:00 - 17:00');
                setIsOnLeave(d.is_on_leave);
                setLeaveType(d.leave_type);
            }
        } catch (error) {
            console.error('[Footer] Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        
        // Listen for internal refresh signals (e.g. from ScheduleScreen)
        const sub = DeviceEventEmitter.addListener('refresh_current_shift', () => {
            fetchStatus();
        });

        // More aggressive polling status (15 detik sekali)
        const interval = setInterval(fetchStatus, 15000);
        
        return () => {
            sub.remove();
            clearInterval(interval);
        };
    }, [fetchStatus, pathname]); // Refresh on signal or navigation

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
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 border ${isOnLeave ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                    {isOnLeave ? <Calendar size={18} color="#f59e0b" /> : <Clock size={18} color="#0a84ff" />}
                </View>
                <View>
                    <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-3">
                        {isOnLeave ? 'STATUS PRESENSI' : 'SHIFT SAAT INI'}
                    </Text>
                    <Text className={`text-sm font-bold mt-0.5 leading-4 ${isOnLeave ? 'text-amber-600' : 'text-slate-800'}`}>
                        {isOnLeave ? `Sedang ${leaveType?.charAt(0).toUpperCase()}${leaveType?.slice(1)}` : shift}
                    </Text>
                </View>
            </View>

            <View className={`px-4 py-2 rounded-xl border ${isOnLeave ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <Text className={`font-black text-[10px] tracking-tight ${isOnLeave ? 'text-amber-600' : 'text-slate-500'}`}>
                    {isOnLeave ? 'MASA IZIN' : hours}
                </Text>
            </View>
        </View>
    );
}
