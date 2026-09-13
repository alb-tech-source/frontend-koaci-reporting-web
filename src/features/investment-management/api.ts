import api from "@/shared/lib/axios";
import { uploadFile } from "@/shared/lib/upload";
import type {
  PaymentMethod,
  ProjectInvestment,
  InvestmentFormValues,
  InvestmentProjectOption,
  InvestmentInvestorOption,
} from "./types";

// Bentuk mentah respons /project-investments (menampung variasi snake_case/camelCase)
interface ApiProjectInvestment {
  project_investment_id?: string;
  projectInvestmentId?: string;
  id?: string;
  project_id?: string;
  projectId?: string;
  investor_id?: string;
  investorId?: string;
  amount?: string | number;
  total_package?: number;
  totalPackage?: number;
  source_account_transaction?: string;
  sourceAccountTransaction?: string;
  account_reference?: string;
  accountReference?: string;
  receipt_number?: string;
  receiptNumber?: string;
  payment_method?: string;
  paymentMethod?: string;
  destination_account_number?: string;
  destinationAccountNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  investor?: ApiInvestorRef;
  Investor?: ApiInvestorRef;
  project?: ApiProjectRef;
  Project?: ApiProjectRef;
  receiptDocument?: ApiReceiptRef | null;
  ReceiptDocument?: ApiReceiptRef | null;
}

interface ApiInvestorRef {
  investor_id?: string;
  investorId?: string;
  nik?: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  email?: string;
  user?: ApiUserRef;
  User?: ApiUserRef;
}

interface ApiUserRef {
  firstname?: string;
  firstName?: string;
  lastname?: string;
  lastName?: string;
  email?: string;
}

interface ApiProjectRef {
  project_id?: string;
  projectId?: string;
  project_key?: string;
  projectKey?: string;
  funding_required?: string | number;
  fundingRequired?: string | number;
  status?: string;
  company?: { company_name?: string; companyName?: string };
  Company?: { company_name?: string; companyName?: string };
}

interface ApiReceiptRef {
  receipt_document_id?: string;
  receiptDocumentId?: string;
  id?: string;
  receipt_name?: string;
  receiptName?: string;
  object_key?: string;
  objectKey?: string;
  uploaded_at?: string;
  uploadedAt?: string;
}

function mapInvestment(raw: ApiProjectInvestment): ProjectInvestment {
  // Tangkap semua kemungkinan nama key (Capital atau Lowercase)
  const inv = raw.investor || raw.Investor || {};
  const usr = inv.user || inv.User || {};
  const proj = raw.project || raw.Project || {};
  const comp = proj.company || proj.Company || {};
  const rec = raw.receiptDocument || raw.ReceiptDocument || null;

  return {
    projectInvestmentId:
      raw.project_investment_id || raw.projectInvestmentId || raw.id || "",
    projectId: raw.project_id || raw.projectId || "",
    investorId: raw.investor_id || raw.investorId || "",
    amount: Number.parseFloat(String(raw.amount ?? 0)) || 0,
    totalPackage: raw.total_package || raw.totalPackage || 0,
    sourceAccountTransaction:
      raw.source_account_transaction || raw.sourceAccountTransaction,
    accountReference: raw.account_reference || raw.accountReference,
    receiptNumber: raw.receipt_number || raw.receiptNumber,
    paymentMethod: (raw.payment_method ||
      raw.paymentMethod ||
      "transfer") as PaymentMethod,
    destinationAccountNumber:
      raw.destination_account_number || raw.destinationAccountNumber,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    project: {
      projectId:
        proj.project_id ||
        proj.projectId ||
        raw.project_id ||
        raw.projectId ||
        "",
      projectKey: proj.project_key || proj.projectKey || "Tanpa Kode",
      fundingRequired:
        Number.parseFloat(
          String(proj.funding_required ?? proj.fundingRequired ?? 0),
        ) || 0,
      status: proj.status || "open",
      company:
        comp.company_name || comp.companyName
          ? { companyName: comp.company_name || comp.companyName || "" }
          : undefined,
    },
    investor: {
      investorId:
        inv.investor_id ||
        inv.investorId ||
        raw.investor_id ||
        raw.investorId ||
        "",
      nik: inv.nik || "-",
      user: {
        firstname:
          usr.firstname ||
          usr.firstName ||
          inv.full_name ||
          inv.fullName ||
          inv.name ||
          "Tanpa Nama",
        lastname: usr.lastname || usr.lastName || "",
        email: usr.email || inv.email || "-",
      },
    },
    receiptDocument: rec
      ? {
          receiptDocumentId:
            rec.receipt_document_id || rec.receiptDocumentId || rec.id || "",
          receiptName: rec.receipt_name || rec.receiptName || "Kwitansi",
          objectKey: rec.object_key || rec.objectKey || "",
          uploadedAt:
            rec.uploaded_at || rec.uploadedAt || new Date().toISOString(),
        }
      : null,
  };
}

export async function fetchInvestments(): Promise<ProjectInvestment[]> {
  const { data } = await api.get("/project-investments", {
    params: { page: 1, limit: 100 },
  });
  const items = data?.data?.items ?? data?.data ?? data ?? [];
  return items.map(mapInvestment);
}

interface ApiProjectListItem {
  projectId?: string;
  project_id?: string;
  id?: string;
  projectKey?: string;
  project_key?: string;
  companyName?: string;
  company?: { companyName?: string; company_name?: string };
}

interface ApiInvestorListItem {
  investorId?: string;
  investor_id?: string;
  id?: string;
  name?: string;
  nik?: string;
  user?: {
    firstname?: string;
    firstName?: string;
    lastname?: string;
    lastName?: string;
  };
}

export async function fetchProjectOptions(): Promise<
  InvestmentProjectOption[]
> {
  const { data } = await api.get("/projects", {
    params: { page: 1, limit: 100, status: "open" },
  });
  const items: ApiProjectListItem[] =
    data?.data?.items ?? data?.data ?? data ?? [];

  return items
    .map((p) => ({
      projectId: p.projectId || p.project_id || p.id || "",
      projectKey: p.projectKey || p.project_key || "Tanpa Kode",
      companyName:
        p.company?.companyName || p.company?.company_name || p.companyName,
    }))
    .filter((p) => p.projectId !== "");
}

export async function fetchInvestorOptions(): Promise<
  InvestmentInvestorOption[]
> {
  const { data } = await api.get("/investors", {
    params: { page: 1, limit: 100, status: "active" },
  });
  const items: ApiInvestorListItem[] =
    data?.data?.items ?? data?.data ?? data ?? [];

  return items
    .map((i) => ({
      investorId: i.investorId || i.investor_id || i.id || "",
      name:
        `${i.user?.firstname || i.user?.firstName || ""} ${i.user?.lastname || i.user?.lastName || ""}`.trim() ||
        i.name ||
        "Tanpa Nama",
      nik: i.nik || "-",
    }))
    .filter((i) => i.investorId !== "");
}

export async function createInvestment(
  values: InvestmentFormValues,
): Promise<ProjectInvestment> {
  const { data } = await api.post("/project-investments", values);
  return mapInvestment(data?.data ?? data);
}

export async function updateInvestment(
  id: string,
  values: Partial<InvestmentFormValues>,
): Promise<ProjectInvestment> {
  const { data } = await api.put(`/project-investments/${id}`, values);
  return mapInvestment(data?.data ?? data);
}

export async function deleteInvestment(id: string): Promise<void> {
  await api.delete(`/project-investments/${id}`);
}

export async function uploadReceiptDocument(
  projectInvestmentId: string,
  file: File,
  receiptName: string,
): Promise<void> {
  await uploadFile(
    "/receipt-documents/presign",
    "/receipt-documents",
    { project_investment_id: projectInvestmentId },
    { project_investment_id: projectInvestmentId, receipt_name: receiptName },
    file,
  );
}

export async function deleteReceiptDocument(receiptId: string): Promise<void> {
  await api.delete(`/receipt-documents/${receiptId}`);
}

export async function getReceiptDownloadUrl(
  receiptId: string,
): Promise<string> {
  const { data } = await api.get(`/receipt-documents/${receiptId}/download`);
  return data?.data?.downloadUrl ?? data?.downloadUrl ?? "";
}
