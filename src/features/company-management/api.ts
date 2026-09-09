import api from "@/shared/lib/axios";
import type { ApiCompany, Company, NewCompanyInput } from "./types";
import { mapApiCompany } from "./types";

export async function fetchCompanies(): Promise<Company[]> {
  const { data } = await api.get("/companies", { params: { limit: 100 } });
  
  const list: ApiCompany[] = data?.data?.items ?? data?.data ?? data ?? [];
  return list.map(mapApiCompany);
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
  const { data } = await api.get(`/company-documents/company/${companyId}`);
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
  
  await api.post("/company-documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function downloadCompanyDocument(documentId: string): Promise<string> {
  const { data } = await api.get(`/company-documents/${documentId}/download`);
  return data?.data?.downloadUrl ?? "";
}

export async function deleteCompanyDocument(documentId: string): Promise<void> {
  await api.delete(`/company-documents/${documentId}`);
}