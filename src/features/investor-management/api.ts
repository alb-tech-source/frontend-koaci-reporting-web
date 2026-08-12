import type { Investor, InvestorFormValues, LinkableUser } from "./types";
import api from "@/shared/lib/axios";

export async function fetchLinkableUsers(): Promise<LinkableUser[]> {
  try {
    let allUsers: any[] = [];
    let existingInvestors: any[] = [];

    try {
      const usersRes = await api.get("/users?page=1&limit=100");
      allUsers =
        usersRes.data?.data?.items ??
        usersRes.data?.data ??
        usersRes.data ??
        [];
    } catch (usersErr) {
      console.error("Gagal mengambil data dari /users:", usersErr);
    }

    try {
      const investorsRes = await api.get("/investors?page=1&limit=100");
      existingInvestors =
        investorsRes.data?.data?.items ??
        investorsRes.data?.data ??
        investorsRes.data ??
        [];
    } catch (investorsErr) {
      console.error("Gagal mengambil data dari /investors:", investorsErr);
    }

    const linkedUserIds = new Set(
      existingInvestors.map((inv: any) => inv.user_id),
    );

    const linkableUsers: LinkableUser[] = allUsers
      .filter((u: any) => {
        const isNotLinked = !linkedUserIds.has(u.user_id || u.id);
        const roleName = (
          u.role?.role_name ||
          u.role_name ||
          u.role ||
          ""
        ).toLowerCase();

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

export async function fetchInvestors(
  page = 1,
  search = "",
  status = "all",
): Promise<Investor[]> {
  try {
    const params: any = { page, limit: 100 };
    if (search) params.search = search;
    if (status !== "all") params.status = status;

    const { data } = await api.get("/investors", { params });
    const investorList = data?.data?.items ?? data?.data ?? data ?? [];

    return investorList.map((inv: any): Investor => {
      const firstName = inv.user?.firstname || "";
      const lastName = inv.user?.lastname || "";
      const combinedName = `${firstName} ${lastName}`.trim();

      return {
        id: inv.investor_id || inv.id || inv.investorId,
        userId: inv.user_id || inv.userId || inv.user?.user_id || inv.user?.id,
        name: combinedName || inv.full_name || inv.fullName || "Tanpa Nama",
        email: inv.user?.email || inv.email || "-", 
        phone: inv.phone || "-",
        investorType: inv.investor_type || inv.investorType || "individual",
        gender: inv.gender || "men",
        nik: inv.nik || "-",
        address: inv.address || "-",
        accountNumber: inv.account_number || inv.accountNumber || "-",
        bankName: inv.bank_name || inv.bankName || "-",
        totalInvestasi: inv.total_investasi || inv.totalInvestasi || 0, 
        status: inv.status || "inactive",
        joinedAt: inv.createdAt ? inv.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        heir: {
          name: inv.heir_name || inv.heirName || "",
          relation: inv.heir_relationship || inv.heirRelationship || "",
          nik: inv.heir_nik || inv.heirNik || "",
          address: inv.heir_address || inv.heirAddress || "",
          accountNumber: inv.heir_account_number || inv.heirAccountNumber || "",
          bankName: inv.heir_bank_name || inv.heirBankName || "",
          phone: inv.heir_phone || inv.heirPhone || "",
        },
        documentName: inv.InvestorDocument?.[0]?.document_name || undefined,
      };
    });
  } catch (error) {
    console.error("Gagal mengambil data dari GET /investors:", error);

    throw error; 
  }
}

export async function createInvestor(payload: InvestorFormValues) {
  const apiPayload = {
    user_id: payload.userId,
    investor_type: payload.investorType,
    status: payload.status,
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

export async function updateInvestor(
  investorId: string,
  payload: Partial<InvestorFormValues>,
) {
  const apiPayload = {
    investor_type: payload.investorType,
    gender: payload.gender,
    nik: payload.nik,
    address: payload.address,
    phone: payload.phone,
    account_number: payload.accountNumber,
    bank_name: payload.bankName,
  };

  const { data } = await api.put(`/investors/${investorId}`, apiPayload);
  return data;
}

export async function updateInvestorStatus(investorId: string, status: string) {
  const { data } = await api.patch(`/investors/${investorId}/status`, {
    status,
  });
  return data;
}

export async function deleteInvestor(investorId: string) {
  const { data } = await api.delete(`/investors/${investorId}`);
  return data;
}

export async function uploadInvestorDocument(
  investorId: string,
  documentName: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("investor_id", investorId);
  formData.append("document_name", documentName);
  formData.append("storage_provider", "cloudflare"); 
  formData.append("file", file);

  const { data } = await api.post("/investor-documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchInvestorDocuments(investorId: string) {
  const { data } = await api.get(`/investor-documents/investor/${investorId}`);

  return data?.data ?? [];
}

export async function downloadInvestorDocument(documentId: string) {
  const { data } = await api.get(`/investor-documents/${documentId}/download`);

  return data; 
}

export async function deleteInvestorDocument(documentId: string) {
  const { data } = await api.delete(`/investor-documents/${documentId}`);

  return data; 
}