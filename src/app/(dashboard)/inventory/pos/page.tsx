'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, alpha, useTheme, CircularProgress, Button, Divider } from "@mui/material";
import { ShoppingCart as CartIcon, History as HistoryIcon } from "@mui/icons-material";
import { motion } from 'framer-motion';
import SalesPOS from '@/components/inventory/SalesPOS';

export default function InventoryPOSPage() {
    const theme = useTheme();
    const [items, setItems] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resItems, resCustomers] = await Promise.all([
                fetch('/api/inventory'),
                fetch('/api/customers')
            ]);
            
            const [dataItems, dataCustomers] = await Promise.all([
                resItems.json(),
                resCustomers.json()
            ]);

            if (dataItems.success) setItems(dataItems.data);
            if (dataCustomers.success) {
                // Filter only logistics customers for inventory transactions
                setCustomers(dataCustomers.data.filter((c: any) => c.customer_type === 'logistics'));
            }
        } catch (err) {
            console.error('Failed to fetch POS data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Listen for updates from other parts of the app (e.g. stock adjustments)
        const handleRefresh = () => fetchData();
        window.addEventListener('inventory-updated', handleRefresh);
        return () => window.removeEventListener('inventory-updated', handleRefresh);
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Menyiapkan Terminal Kasir...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            width: '100%',
            height: 'calc(100vh - 64px)', // Adjusting for header height if needed
            bgcolor: '#fff',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <SalesPOS items={items} customers={customers} />
        </Box>
    );
}
