import type { HeirData, Investor, LinkableUser } from "./types";
import api from "@/shared/lib/axios";

const emptyHeir: HeirData = {
  name: "",
  relation: "",
  nik: "",
  address: "",
  accountNumber: "",
  bankName: "",
  phone: "",
};

export const dummyInvestors: Investor[] = [
  {
    id: "INV-001",
    userId: "USR-003",
    name: "Ahmad Fauzi",
    email: "ahmad.fauzi@example.com",
    phone: "+62 812-3456-7890",
    investorType: "individu",
    gender: "male",
    nik: "3175021204890003",
    address: "Jl. Melati No. 21, RT 03/RW 05, Kebayoran Baru, Jakarta Selatan",
    accountNumber: "1234567890",
    bankName: "BCA Syariah",
    documentName: "ktp-ahmad-fauzi.pdf",
    heir: {
      name: "Laila Fauzi",
      relation: "spouse",
      nik: "3175024506920004",
      address: "Jl. Melati No. 21, Jakarta Selatan",
      accountNumber: "9988776655",
      bankName: "BCA",
      phone: "+62 812-1111-2222",
    },
    totalInvestasi: 245_000_000,
    status: "active",
    joinedAt: "2024-11-04",
  },
  {
    id: "INV-002",
    userId: "USR-004",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@example.com",
    phone: "+62 813-2211-4488",
    investorType: "individu",
    gender: "female",
    nik: "3273015508910002",
    address: "Jl. Cihampelas No. 88, Bandung, Jawa Barat",
    accountNumber: "0987654321",
    bankName: "Bank Syariah Indonesia (BSI)",
    documentName: "ktp-siti.pdf",
    heir: { ...emptyHeir },
    totalInvestasi: 120_500_000,
    status: "active",
    joinedAt: "2025-01-18",
  },
  {
    id: "INV-003",
    userId: "USR-007",
    name: "Budi Santoso",
    email: "budi.santoso@example.com",
    phone: "+62 811-9090-1212",
    investorType: "korporasi",
    gender: "male",
    nik: "3578011003850001",
    address: "Jl. Basuki Rahmat No. 12, Surabaya, Jawa Timur",
    accountNumber: "5566778899",
    bankName: "Mandiri",
    documentName: "nib-budi-corp.pdf",
    heir: { ...emptyHeir },
    totalInvestasi: 58_000_000,
    status: "pending",
    joinedAt: "2025-03-22",
  },
  {
    id: "INV-004",
    userId: "USR-008",
    name: "Dewi Lestari",
    email: "dewi.lestari@example.com",
    phone: "+62 878-5511-2233",
    investorType: "individu",
    gender: "female",
    nik: "3374026607880005",
    address: "Jl. Pandanaran No. 45, Semarang, Jawa Tengah",
    accountNumber: "4433221100",
    bankName: "BNI",
    documentName: "ktp-dewi.pdf",
    heir: {
      name: "Rafi Lestari",
      relation: "child",
      nik: "3374021203100006",
      address: "Jl. Pandanaran No. 45, Semarang",
      accountNumber: "1122334455",
      bankName: "BNI",
      phone: "+62 878-3333-4444",
    },
    totalInvestasi: 410_750_000,
    status: "active",
    joinedAt: "2024-07-09",
  },
  {
    id: "INV-005",
    userId: "USR-005",
    name: "Rizky Pratama",
    email: "rizky.pratama@example.com",
    phone: "+62 852-7788-9911",
    investorType: "individu",
    gender: "male",
    nik: "3671012509950007",
    address: "Jl. Raya Serpong No. 7, Tangerang Selatan, Banten",
    accountNumber: "6677889900",
    bankName: "BRI",
    heir: { ...emptyHeir },
    totalInvestasi: 0,
    status: "inactive",
    joinedAt: "2025-05-30",
  },
];

export async function fetchLinkableUsers(): Promise<LinkableUser[]> {
  try {
    // 1. Tembak API daftar user (Ambil 100 data terakhir agar semua user masuk ke dropdown)
    const { data } = await api.get('/users?page=1&limit=100');

    // 2. Ekstrak array dari JSON response (Sesuaikan jika bentuknya data.data atau data.users)
    const userList = data?.data || data || [];

    // 3. Filter hanya Role Investor, lalu format menjadi struktur LinkableUser untuk UI
    const investorUsers: LinkableUser[] = userList
      .filter((u: any) => 
        // Mengakomodasi berbagai kemungkinan nama variabel role dari backend
        u.role?.role_name === "investor" || 
        u.role_name === "investor" || 
        u.role === "investor"
      )
      .map((u: any) => ({
        id: u.user_id || u.id,
        name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
        email: u.email,
      }));

    return investorUsers;
  } catch (error) {
    console.error("Gagal mengambil data user dari API:", error);
    return []; // Kembalikan array kosong agar UI tidak crash jika API gagal
  }
}

export async function fetchInvestors(): Promise<Investor[]> {
  return dummyInvestors;
}

