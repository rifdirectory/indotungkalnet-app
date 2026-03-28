'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  Card, 
  InputBase, 
  IconButton, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TablePagination,
  TableRow, 
  TableSortLabel,
  Chip, 
  alpha,
  useTheme,
  Avatar,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Menu
} from "@mui/material";
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

export default function CustomersPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activePlan, setActivePlan] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('full_name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Dialog State
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    address: '',
    package: '',
    product_id: '',
    status: 'active',
    customer_type: 'broadband',
    join_date: new Date().toISOString().split('T')[0],
    pppoe_username: '',
    pppoe_password: '',
    phone_number: ''
  });

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCustomer, setMenuCustomer] = useState<any>(null);

  const fetchData = async () => {
    const [custRes, prodRes] = await Promise.all([
      fetch('/api/customers').then(res => res.json()),
      fetch('/api/products').then(res => res.json())
    ]);
    if (custRes.success) setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
    if (prodRes.success) setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditMode(false);
    setSelectedCustomer(null);
    setFormData({
      full_name: '',
      email: '',
      address: '',
      package: '',
      product_id: '',
      status: 'active',
      customer_type: 'broadband',
      join_date: new Date().toISOString().split('T')[0],
      pppoe_username: '',
      pppoe_password: '',
      phone_number: ''
    });
    setOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setEditMode(true);
    setSelectedCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      email: customer.email || '',
      address: customer.address || '',
      package: customer.package || '',
      product_id: customer.product_id || '',
      status: customer.status || 'active',
      customer_type: customer.customer_type || 'broadband',
      join_date: String(customer.join_date).split('T')[0],
      pppoe_username: customer.pppoe_username || '',
      pppoe_password: customer.pppoe_password || '',
      phone_number: customer.phone_number || ''
    });
    setOpen(true);
    handleMenuClose();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    const url = editMode ? `/api/customers/${selectedCustomer.id}` : '/api/customers';
    const method = editMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      handleClose();
      fetchData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus customer ini?')) return;
    
    const res = await fetch(`/api/customers/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      handleMenuClose();
      fetchData();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, customer: any) => {
    setAnchorEl(event.currentTarget);
    setMenuCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCustomer(null);
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredCustomers = (customers || [])
    .filter(customer => {
      if (!customer) return false;
      const matchesSearch =
        (customer.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.package || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone_number || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = activeType === 'all' || customer.customer_type === activeType;
      const matchesPlan = activePlan === 'all' || customer.package === activePlan || String(customer.product_id) === activePlan;
      const matchesStatus = activeStatus === 'all' || customer.status === activeStatus;

      return matchesSearch && matchesType && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      const isAsc = order === 'asc';
      if (a[orderBy] < b[orderBy]) return isAsc ? -1 : 1;
      if (a[orderBy] > b[orderBy]) return isAsc ? 1 : -1;
      return 0;
    });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Data Customer
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Kelola data pelanggan ITNET secara efisien.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 3, fontWeight: 600, px: 3, py: 1.2 }}
        >
          Tambah Customer
        </Button>
      </Stack>

      <Card sx={{ overflow: 'hidden', borderRadius: 3 }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.01)'
        }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(0, 0, 0, 0.03)', 
              px: 2, 
              py: 0.75, 
              borderRadius: 3,
              width: 320,
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}>
              <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
              <InputBase
                placeholder="Search name, email, or package..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ color: 'text.primary', fontSize: '0.875rem', width: '100%' }}
              />
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                select
                size="small"
                label="Tipe"
                value={activeType}
                onChange={(e) => {
                  setActiveType(e.target.value);
                  setActivePlan('all'); // Reset plan when type changes
                }}
                sx={{ minWidth: 120 }}
                InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
              >
                <MenuItem value="all">Semua Tipe</MenuItem>
                <MenuItem value="broadband">Broadband</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
                <MenuItem value="mitra">Mitra</MenuItem>
                <MenuItem value="operator">Operator</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="Paket"
                value={activePlan}
                onChange={(e) => setActivePlan(e.target.value)}
                sx={{ minWidth: 150 }}
                InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
              >
                <MenuItem value="all">Semua Paket</MenuItem>
                {Array.from(new Set(
                  customers
                    .filter(c => activeType === 'all' || c.customer_type === activeType)
                    .map(c => c.package)
                    .filter(Boolean)
                )).sort().map(pkg => (
                  <MenuItem key={pkg} value={pkg}>{pkg}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Status"
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
                sx={{ minWidth: 120 }}
                InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
              >
                <MenuItem value="all">Semua Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Stack>
          </Stack>
          <Tooltip title="Download Report">
            <IconButton>
              <DownloadIcon sx={{ color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f1f3f4' }}>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'full_name'}
                      direction={orderBy === 'full_name' ? order : 'asc'}
                      onClick={() => handleRequestSort('full_name')}
                      sx={{ fontWeight: 600, color: 'text.secondary' }}
                    >
                      Customer
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Alamat</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                      sx={{ fontWeight: 600, color: 'text.secondary' }}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'package'}
                      direction={orderBy === 'package' ? order : 'asc'}
                      onClick={() => handleRequestSort('package')}
                      sx={{ fontWeight: 600, color: 'text.secondary' }}
                    >
                      Plan
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>No HP</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer, index) => (
                <TableRow 
                  key={`${customer.id || 'new'}-${index}`}
                  hover
                  sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: 'primary.main',
                          fontWeight: 700,
                          borderRadius: 3
                        }}
                      >
                        {(customer.full_name || 'C').charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {customer.full_name || 'Unknown Customer'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.625rem' }}>
                          {customer.customer_type}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customer.address || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.status}
                      size="small"
                      sx={{ 
                        height: 24,
                        px: 1,
                        borderRadius: 3,
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        bgcolor: alpha(
                          customer.status === 'active' ? theme.palette.success.main : 
                          customer.status === 'suspended' ? theme.palette.error.main : 
                          theme.palette.text.secondary, 0.1
                        ),
                        color: 
                          customer.status === 'active' ? 'success.main' : 
                          customer.status === 'suspended' ? 'error.main' : 
                          'text.secondary',
                        border: `1px solid ${alpha(
                          customer.status === 'active' ? theme.palette.success.main : 
                          customer.status === 'suspended' ? theme.palette.error.main : 
                          theme.palette.text.secondary, 0.2
                        )}`
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {customer.plan_name || customer.package}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary', fontWeight: 600 }}>
                    {customer.phone_number || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, customer)}>
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 150, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
      >
        <MenuItem onClick={() => handleOpenEdit(menuCustomer)} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Edit</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleDelete(menuCustomer.id)} sx={{ gap: 1.5, color: 'error.main' }}>
          <DeleteIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 500 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editMode ? 'Edit Customer' : 'Tambah Customer Baru'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nama Lengkap"
              fullWidth
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <TextField
                label="Nomor HP / WhatsApp"
                fullWidth
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </Stack>
            <TextField
              label="Alamat"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Tipe Customer"
                fullWidth
                value={formData.customer_type}
                onChange={(e) => {
                  setFormData({ ...formData, customer_type: e.target.value, package: '' });
                }}
              >
                <MenuItem value="broadband">Broadband</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
                <MenuItem value="mitra">Mitra</MenuItem>
                <MenuItem value="operator">Operator</MenuItem>
              </TextField>
              <TextField
                select
                label="Status"
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Stack>

            <TextField
              select
              label="Package / Plan"
              fullWidth
              value={formData.product_id || formData.package}
              onChange={(e) => {
                const selectedProd = products.find(p => p.id === e.target.value || p.name === e.target.value);
                setFormData({ 
                  ...formData, 
                  product_id: selectedProd ? selectedProd.id : '',
                  package: selectedProd ? selectedProd.name : e.target.value 
                });
              }}
              disabled={!formData.customer_type}
            >
              {products
                .filter(p => p.category.toLowerCase() === formData.customer_type.toLowerCase())
                .map((prod) => (
                  <MenuItem key={prod.id} value={prod.id}>
                    {prod.name} - {prod.category} ({prod.speed_mbps} Mbps)
                  </MenuItem>
                ))}
              {products.filter(p => p.category.toLowerCase() === formData.customer_type.toLowerCase()).length === 0 && (
                <MenuItem disabled>Tidak ada produk untuk tipe ini</MenuItem>
              )}
            </TextField>

            <Stack direction="row" spacing={2}>
              <TextField
                label="PPPoE Username"
                fullWidth
                value={formData.pppoe_username}
                onChange={(e) => setFormData({ ...formData, pppoe_username: e.target.value })}
              />
              <TextField
                label="PPPoE Password"
                fullWidth
                value={formData.pppoe_password}
                onChange={(e) => setFormData({ ...formData, pppoe_password: e.target.value })}
              />
            </Stack>

            <TextField
              label="Tanggal Bergabung"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.join_date}
              onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit">Batal</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: 3 }}>
            {editMode ? 'Simpan Perubahan' : 'Tambah Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
