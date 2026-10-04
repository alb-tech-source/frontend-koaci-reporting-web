import type {
  Gender,
  HeirRelation,
  Investor,
  InvestorFormValues,
  InvestorStatus,
  InvestorType,
  LinkableUser,
} from "./types";
import api from "@/shared/lib/axios";
import { fetchAllPages } from "@/shared/lib/fetchAllPages";
import { uploadFile } from "@/shared/lib/upload";

// Bentuk mentah baris user dari GET /users
interface ApiUserRow {
  user_id?: string;
  id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: { role_name?: string } | string;
  role_name?: string;
}

// Bentuk mentah baris investor dari GET /investors
interface ApiInvestorRow {
  investor_id?: string;
  investorId?: string;
  id?: string;
  user_id?: string;
  userId?: string;
  user?: {
    user_id?: string;
    id?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
  };
  full_name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  investor_type?: string;
  investorType?: string;
  gender?: string;
  nik?: string;
  address?: string;
  account_number?: string;
  accountNumber?: string;
  bank_name?: string;
  bankName?: string;
  total_investasi?: number;
  totalInvestasi?: number;
  status?: string;
  createdAt?: string;
  investments?: {
    amount?: string | number;
  }[];
  heir_name?: string;
  heirName?: string;
  heir_relationship?: string;
  heirRelationship?: string;
  heir_nik?: string;
  heirNik?: string;
  heir_address?: string;
  heirAddress?: string;
  heir_account_number?: string;
  heirAccountNumber?: string;
  heir_bank_name?: string;
  heirBankName?: string;
  heir_phone?: string;
  heirPhone?: string;
  investorDocument?: { document_name?: string }[];
  InvestorDocument?: { document_name?: string }[];
}

function roleNameOf(u: ApiUserRow): string {
  if (u.role && typeof u.role === "object") return u.role.role_name ?? "";
  if (typeof u.role === "string") return u.role;
  return u.role_name ?? "";
}

export async function fetchLinkableUsers(): Promise<LinkableUser[]> {
  try {
    const [usersRes, investorsRes] = await Promise.allSettled([
      fetchAllPages<ApiUserRow>("/users", { is_active: true }),
      fetchAllPages<ApiInvestorRow>("/investors"),
    ]);

    const allUsers = usersRes.status === "fulfilled" ? usersRes.value : [];
    const existingInvestors =
      investorsRes.status === "fulfilled" ? investorsRes.value : [];

    const linkedUserIds = new Set(
      existingInvestors
        .map((inv) => inv.user_id || inv.userId || inv.id)
        .filter((id): id is string => !!id),
    );

    return allUsers
      .filter((u) => {
        const userId = u.user_id || u.id;
        const isNotLinked = !linkedUserIds.has(userId ?? "");
        const roleName = (roleNameOf(u) || "").toLowerCase();

        // Hanya user biasa dan investor yang belum tertaut yang boleh muncul di dropdown
        return isNotLinked && (roleName === "user" || roleName === "investor");
      })
      .map((u) => ({
        id: u.user_id || u.id || "",
        name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
        email: u.email || "-",
      }));
  } catch (error) {
    console.error("Gagal memproses logika filter user linkable:", error);
    return [];
  }
}

export async function fetchInvestors(): Promise<Investor[]> {
  try {
    const PAGE_LIMIT = 100;
    const investorList: ApiInvestorRow[] = [];
    let page = 1;
    let totalPages = 1;

    // Ambil semua halaman agar daftar selalu memuat data investor aktual
    // terbaru dari API, bukan hanya 100 baris pertama.
    do {
      const { data } = await api.get("/investors", {
        params: { page, limit: PAGE_LIMIT },
      });

      const payload = data?.data ?? data;
      const items: ApiInvestorRow[] =
        payload?.items ?? (Array.isArray(payload) ? payload : []);

      investorList.push(...items);

      const metaTotalPages = payload?.meta?.totalPages;
      if (metaTotalPages) {
        totalPages = metaTotalPages;
      } else {
        // Fallback bila backend tidak mengirim meta: lanjut selama halaman penuh
        totalPages = items.length === PAGE_LIMIT ? page + 1 : page;
      }
      page += 1;
    } while (page <= totalPages);

    return investorList.map((inv): Investor => {
      const firstName = inv.user?.firstname || "";
      const lastName = inv.user?.lastname || "";
      const combinedName = `${firstName} ${lastName}`.trim();

      // Total investasi = jumlah seluruh amount di array investments (amount string)
      const totalInvestasi = (inv.investments ?? []).reduce(
        (sum, investment) => sum + (Number(investment.amount) || 0),
        0,
      );

      return {
        id: inv.investor_id || inv.id || inv.investorId || "",
        userId:
          inv.user_id || inv.userId || inv.user?.user_id || inv.user?.id || "",
        name: combinedName || inv.full_name || inv.fullName || "Tanpa Nama",
        email: inv.user?.email || inv.email || "-",
        phone: inv.phone || "-",
        investorType: (inv.investor_type ||
          inv.investorType ||
          "individual") as InvestorType,
        gender: (inv.gender || "men") as Gender,
        nik: inv.nik || "-",
        address: inv.address || "-",
        accountNumber: inv.account_number || inv.accountNumber || "-",
        bankName: inv.bank_name || inv.bankName || "-",
        totalInvestasi,
        status: (inv.status || "inactive") as InvestorStatus,
        joinedAt: inv.createdAt
          ? inv.createdAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        heir: {
          name: inv.heir_name || inv.heirName || "",
          relation: (inv.heir_relationship ||
            inv.heirRelationship ||
            "") as HeirRelation,
          nik: inv.heir_nik || inv.heirNik || "",
          address: inv.heir_address || inv.heirAddress || "",
          accountNumber: inv.heir_account_number || inv.heirAccountNumber || "",
          bankName: inv.heir_bank_name || inv.heirBankName || "",
          phone: inv.heir_phone || inv.heirPhone || "",
        },
        documentName:
          (inv.investorDocument ?? inv.InvestorDocument)?.[0]?.document_name ||
          undefined,
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
    status: payload.status,
    gender: payload.gender,
    nik: payload.nik,
    address: payload.address,
    phone: payload.phone,
    account_number: payload.accountNumber,
    bank_name: payload.bankName,
    heir_name: payload.heir?.name || undefined,
    heir_relationship: payload.heir?.relation || undefined,
    heir_nik: payload.heir?.nik || undefined,
    heir_address: payload.heir?.address || undefined,
    heir_account_number: payload.heir?.accountNumber || undefined,
    heir_bank_name: payload.heir?.bankName || undefined,
    heir_phone: payload.heir?.phone || undefined,
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
  return uploadFile(
    "/investor-documents/presign",
    "/investor-documents",
    { investor_id: investorId },
    { investor_id: investorId, document_name: documentName },
    file,
  );
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
