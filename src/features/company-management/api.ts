import api from "@/shared/lib/axios";
import { uploadFile } from "@/shared/lib/upload";
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

export async function createCompany(
  payload: NewCompanyInput,
): Promise<Company> {
  const payloads = {
    ...(payload.company_name !== ""
      ? { company_name: payload.company_name }
      : {}),
    ...(payload.company_address !== ""
      ? { company_address: payload.company_address }
      : {}),
    ...(payload.company_email !== ""
      ? { company_email: payload.company_email }
      : {}),
    ...(payload.company_type !== ""
      ? { company_type: payload.company_type }
      : {}),
    ...(payload.description !== "" ? { description: payload.description } : {}),
    ...(payload.director_name !== ""
      ? { director_name: payload.director_name }
      : {}),
    ...(payload.director_phone !== ""
      ? { director_phone: payload.director_phone }
      : {}),
    ...(payload.director_privy !== ""
      ? { director_privy: payload.director_privy }
      : {}),
    ...(payload.heirs_director_address !== ""
      ? { heirs_director_address: payload.heirs_director_address }
      : {}),
    ...(payload.heirs_director_name !== ""
      ? { heirs_director_name: payload.heirs_director_name }
      : {}),
    ...(payload.heirs_director_phone !== ""
      ? { heirs_director_phone: payload.heirs_director_phone }
      : {}),
    ...(payload.industry_sector !== ""
      ? { industry_sector: payload.industry_sector }
      : {}),
    ...(payload.status !== "" ? { status: payload.status } : {}),
    ...(payload.website !== "" ? { website: payload.website } : {}),
  };

  const { data } = await api.post("/companies", {
    ...payloads,
    status: "active",
  });
  return mapApiCompany(data);
}

export async function updateCompany(
  companyId: string,
  payload: Partial<NewCompanyInput>,
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
  file: File,
): Promise<void> {
  await uploadFile(
    "/company-documents/presign",
    "/company-documents",
    { company_id: companyId },
    {
      company_id: companyId,
      document_type: documentType,
      document_name: documentName,
    },
    file,
  );
}

export async function downloadCompanyDocument(
  documentId: string,
): Promise<string> {
  const { data } = await api.get(`/company-documents/${documentId}/download`);
  return data?.data?.downloadUrl ?? "";
}

export async function deleteCompanyDocument(documentId: string): Promise<void> {
  await api.delete(`/company-documents/${documentId}`);
}
