import type { Investor, InvestorFormValues, LinkableUser } from "./types";
import api from "@/shared/lib/axios";

export async function fetchLinkableUsers(): Promise<LinkableUser[]> {
  try {
    let allUsers: any[] = [];
    let existingInvestors: any[] = [];

    try {
      const usersRes = await api.get("/users?page=1&limit=100");
      allUsers = usersRes.data?.data?.items ?? usersRes.data?.data ?? usersRes.data ?? [];
    } catch (usersErr) {
      console.error("Gagal mengambil data dari /users:", usersErr);
    }

    try {
      const investorsRes = await api.get("/investors?page=1&limit=100"); 
      existingInvestors = investorsRes.data?.data?.items ?? investorsRes.data?.data ?? investorsRes.data ?? [];
    } catch (investorsErr) {
      console.error("Gagal mengambil data dari /investors:", investorsErr);
    }

    const linkedUserIds = new Set(existingInvestors.map((inv: any) => inv.user_id));

    // Filter yang Diperketat: Belum punya profil dan role-nya tepat
    const linkableUsers: LinkableUser[] = allUsers
      .filter((u: any) => {
        // Belum terhubung di tabel investor
        const isNotLinked = !linkedUserIds.has(u.user_id || u.id);

        // Menangkap nilai role dari berbagai kemungkinan format Backend
        const roleName = (u.role?.role_name || u.role_name || u.role || "").toLowerCase();
        
        // Hanya izinkan role "user" dan "investor" (Kecualikan Admin/BOD)
        const isEligibleRole = roleName === "user" || roleName === "investor";

        return isNotLinked && isEligibleRole;
      })
      .map((u: any) => ({
        id: u.user_id || u.id,
        name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
        email: u.email,
      }));

    return linkableUsers;
  } catch (error) {
    console.error("Gagal memproses logika filter user linkable:", error);
    return [];
  }
}

export async function fetchInvestors(page = 1, search = "", status = "all"): Promise<Investor[]> {
  const params: any = { page, limit: 100 }; 
  if (search) params.search = search;
  if (status !== "all") params.status = status;

  const { data } = await api.get("/investors", { params });

  const investorList = data?.data?.items ?? data?.data ?? data ?? [];

  return investorList.map((inv: any): Investor => ({
    id: inv.investor_id,
    userId: inv.user_id,
    name: inv.full_name,
    email: inv.email, 
    phone: inv.phone,
    investorType: inv.investor_type,
    gender: inv.gender,
    nik: inv.nik,
    address: inv.address,
    accountNumber: inv.account_number,
    bankName: inv.bank_name,
    totalInvestasi: inv.total_investasi || 0, 
    status: inv.status,
    joinedAt: inv.createdAt ? inv.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    heir: {
      name: inv.heir_name || "",
      relation: inv.heir_relationship || "",
      nik: inv.heir_nik || "",
      address: inv.heir_address || "",
      accountNumber: inv.heir_account_number || "",
      bankName: inv.heir_bank_name || "",
      phone: inv.heir_phone || "",
    },
    documentName: inv.InvestorDocument?.[0]?.document_name || undefined,
  }));
}

// Fungsi POST Create Investor
export async function createInvestor(payload: InvestorFormValues) {
  const apiPayload = {
    user_id: payload.userId,
    investor_type: payload.investorType,
    status: "pending",
    gender: payload.gender,
    nik: payload.nik,
    address: payload.address,
    phone: payload.phone,
    account_number: payload.accountNumber,
    bank_name: payload.bankName,

    heir_name: payload.heir.name || undefined,
    heir_relationship: payload.heir.relation || undefined,
    heir_nik: payload.heir.nik || undefined,
    heir_address: payload.heir.address || undefined,
    heir_account_number: payload.heir.accountNumber || undefined,
    heir_bank_name: payload.heir.bankName || undefined,
    heir_phone: payload.heir.phone || undefined,
  };

  const { data } = await api.post("/investors", apiPayload);
  return data;
}

export async function updateInvestor(investorId: string, payload: Partial<InvestorFormValues>) {
  const apiPayload = {
    investor_type: payload.investorType,
    gender: payload.gender,
    nik: payload.nik,
    address: payload.address,
    phone: payload.phone,
    account_number: payload.accountNumber,
    bank_name: payload.bankName,
    // status: payload.status, 
  };

  const { data } = await api.put(`/investors/${investorId}`, apiPayload);
  return data;
}

export async function updateInvestorStatus(investorId: string, status: string) {
  const { data } = await api.patch(`/investors/${investorId}/status`, { status });
  return data;
}

export async function uploadInvestorDocument(investorId: string, documentName: string, file: File) {
  const formData = new FormData();
  formData.append("investor_id", investorId);
  formData.append("document_name", documentName);
  formData.append("storage_provider", "local"); 
  formData.append("file", file);

  const { data } = await api.post("/investors/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}