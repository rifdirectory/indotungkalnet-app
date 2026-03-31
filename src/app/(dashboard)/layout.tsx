'use client';
import dynamic from 'next/dynamic';
const Sidebar = dynamic(() => import("@/components/Sidebar").then(mod => mod.Sidebar), { ssr: false });
import { Header } from "@/components/Header";
import { Box } from "@mui/material";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Header />
        {children}
      </Box>
    </Box>
  );
}
