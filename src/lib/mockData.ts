export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  address: string;
  phone: string;
  email: string;
  plan: string;
  status: 'active' | 'suspended' | 'lead' | 'terminated';
  joined_at: string;
}

export const mockCustomers: Customer[] = [
  {
    id: 1,
    customer_code: "ITN-0001",
    full_name: "Budi Santoso",
    address: "Jl. Merdeka No. 12, Tungkal Ilir",
    phone: "081234567890",
    email: "budi.s@email.com",
    plan: "Home Fiber 20 Mbps",
    status: "active",
    joined_at: "2024-01-15",
  },
  {
    id: 2,
    customer_code: "ITN-0002",
    full_name: "Siti Aminah",
    address: "Perum Permata Blok A2, Tungkal Empat Kota",
    phone: "082198765432",
    email: "siti.a@email.com",
    plan: "Home Fiber 10 Mbps",
    status: "active",
    joined_at: "2024-02-10",
  },
  {
    id: 3,
    customer_code: "ITN-0003",
    full_name: "Warung Makan Barokah",
    address: "Jl. H. Asmuni No. 45, Desa Tungkal",
    phone: "081344556677",
    email: "barokah@email.com",
    plan: "Business Fast 50 Mbps",
    status: "active",
    joined_at: "2023-12-01",
  },
  {
    id: 4,
    customer_code: "ITN-0004",
    full_name: "Rian Hidayat",
    address: "Jl. Jend. Sudirman Gg. Melati, Jambi",
    phone: "085277889900",
    email: "rian.h@email.com",
    plan: "Home Fiber 10 Mbps",
    status: "suspended",
    joined_at: "2024-03-05",
  },
];
