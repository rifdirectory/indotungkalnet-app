'use client';

import * as React from 'react';
import { 
  Box, 
  InputBase, 
  IconButton, 
  Badge, 
  Avatar, 
  Typography, 
  Stack,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Notifications as NotificationsIcon,
  Person as PersonIcon
} from '@mui/icons-material';

interface HeaderContentProps {
  onLogout?: () => void;
}

export default function HeaderContent({ onLogout }: HeaderContentProps) {
  return (
    <>
      {/* Search Bar */}
      <Box sx={{
        display: { xs: 'none', sm: 'flex' },
        alignItems: 'center',
        bgcolor: '#f1f3f4', // Google Gray input
        px: 2,
        py: 0.5,
        borderRadius: 3,
        width: { xs: '100%', md: 400 },
        mx: 0,
        border: '1px solid transparent',
        '&:focus-within': {
          bgcolor: '#ffffff',
          border: '1px solid #dadce0',
          boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
        }
      }}>
        <SearchIcon sx={{ color: 'text.secondary', mr: 1.5, fontSize: 20 }} />
        <InputBase
          placeholder="Search customer, invoice, or ticket..."
          sx={{
            color: 'text.primary',
            fontSize: '0.875rem',
            width: '100%',
            '& input::placeholder': { color: 'text.secondary', opacity: 1 }
          }}
        />
      </Box>

      {/* Right Actions */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
        <IconButton color="inherit" sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 0 }}>
          <Badge badgeContent={3} color="primary" variant="dot">
            <NotificationsIcon sx={{ color: 'text.secondary' }} />
          </Badge>
        </IconButton>

        <Box sx={{ width: '1px', height: 32, bgcolor: 'divider', mx: 2 }} />

        <Stack 
          direction="row" 
          spacing={1.5} 
          alignItems="center" 
          onClick={onLogout}
          sx={{ 
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <Stack spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>Administrator</Typography>
          </Stack>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              borderRadius: 3,
              bgcolor: 'primary.main',
            }}
          >
            <PersonIcon sx={{ fontSize: 20 }} />
          </Avatar>
        </Stack>
      </Stack>
    </>
  );
}
