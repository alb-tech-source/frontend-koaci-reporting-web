import api from "@/shared/lib/axios";
import type { ApiCompany, Company, NewCompanyInput } from "./types";
import { mapApiCompany } from "./types";

export async function fetchCompanies(page = 1, limit = 10): Promise<{
  items: Company[];
  total: number;
  totalPages: number;
}> {
  const { data } = await api.get("/companies", { params: { page, limit } });
  const list: ApiCompany[] = data?.data ?? [];
  const meta = data?.meta ?? { total: list.length, totalPages: 1 };
  return {
    items: list.map(mapApiCompany),
    total: meta.total,
    totalPages: meta.totalPages,
  };
}

export async function fetchCompany(companyId: string): Promise<Company> {
  const { data } = await api.get(`/companies/${companyId}`);
  return mapApiCompany(data);
}

export async function createCompany(payload: NewCompanyInput): Promise<Company> {
  const { data } = await api.post("/companies", { ...payload, status: "active" });
  return mapApiCompany(data);
}

export async function updateCompany(
  companyId: string,
  payload: Partial<NewCompanyInput>
): Promise<Company> {
  const { data } = await api.put(`/companies/${companyId}`, payload);
  return mapApiCompany(data);
}

export async function deleteCompany(companyId: string): Promise<void> {
  await api.delete(`/companies/${companyId}`);
}

// --- Company Documents ---

export async function fetchCompanyDocuments(companyId: string) {
  const { data } = await api.get(`/companies/${companyId}/documents`);
  return data?.data ?? [];
}

export async function uploadCompanyDocument(
  companyId: string,
  documentType: string,
  documentName: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("company_id", companyId);
  formData.append("document_type", documentType);
  formData.append("document_name", documentName);
  formData.append("storage_provider", "cloudflare");
  formData.append("file", file);
  await api.post("/companies/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function downloadCompanyDocument(documentId: string): Promise<string> {
  const { data } = await api.get(`/companies/documents/${documentId}/download`);
  return data?.data?.downloadUrl ?? "";
}

export async function deleteCompanyDocument(documentId: string): Promise<void> {
  await api.delete(`/companies/documents/${documentId}`);
}