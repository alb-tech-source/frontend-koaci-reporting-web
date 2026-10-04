import api from "@/shared/lib/axios"; // Pastikan path ini sesuai dengan instance axios Anda
import { fetchAllPages } from "@/shared/lib/fetchAllPages";
import { uploadFile } from "@/shared/lib/upload";
import {
  type ApiProject,
  type Project,
  type ProjectFormValues,
  type CompanyOption,
  mapApiProject,
  mapToApiProjectPayload,
} from "./types";

export async function fetchProjects(): Promise<Project[]> {
  const items = await fetchAllPages<ApiProject>("/projects");
  return items.map(mapApiProject);
}

/**
 * Dana terkumpul per proyek = SUM(amount) ProjectInvestment, dikelompokkan per project_id.
 * Kolom aggregate_fund_amount sudah dihapus dari tabel Project, jadi nilainya diturunkan
 * dari data investasi (sama seperti principal_amount pada settlement di backend).
 */
export async function fetchProjectFundCollected(): Promise<
  Record<string, number>
> {
  const PAGE_LIMIT = 100;
  const totals: Record<string, number> = {};
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await api.get("/project-investments", {
      params: { page, limit: PAGE_LIMIT },
    });
    const payload = data?.data ?? data;
    const items: { project_id?: string; amount?: string | number }[] =
      payload?.items ?? (Array.isArray(payload) ? payload : []);

    for (const item of items) {
      if (!item.project_id) continue;
      totals[item.project_id] =
        (totals[item.project_id] ?? 0) + (Number(item.amount) || 0);
    }

    const metaTotalPages = payload?.meta?.totalPages ?? data?.meta?.totalPages;
    totalPages = metaTotalPages ?? (items.length === PAGE_LIMIT ? page + 1 : page);
    page += 1;
  } while (page <= totalPages);

  return totals;
}

export async function fetchProject(projectId: string): Promise<Project> {
  const { data } = await api.get(`/projects/${projectId}`);
  return mapApiProject(data?.data);
}

export async function createProject(
  values: ProjectFormValues,
): Promise<Project> {
  const payload = mapToApiProjectPayload(values);
  const { data } = await api.post("/projects", payload);
  return mapApiProject(data?.data);
}

export async function updateProject(
  projectId: string,
  values: ProjectFormValues,
): Promise<Project> {
  const payload = {
    ...mapToApiProjectPayload(values),
    // Saat edit selalu dikirim (string kosong = hapus nama); backend menolak null
    project_name: values.projectName.trim(),
  };
  const { data } = await api.put(`/projects/${projectId}`, payload);
  return mapApiProject(data?.data);
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

// Dapatkan Opsi Company untuk Form Dropdown
export async function fetchCompanyOptions(): Promise<CompanyOption[]> {
  const companies = await fetchAllPages<{
    company_id: string;
    company_name: string;
  }>("/companies", { status: "active" });
  return companies.map((c) => ({
    companyId: c.company_id,
    companyName: c.company_name,
  }));
}

// --- PROJECT DOCUMENTS API ---
export async function fetchProjectDocuments(projectId: string) {
  const { data } = await api.get(`/project-documents/project/${projectId}`);
  return data?.data ?? [];
}

export async function uploadProjectDocument(
  projectId: string,
  documentType: string,
  documentName: string,
  file: File,
) {
  await uploadFile(
    "/project-documents/presign",
    "/project-documents",
    { project_id: projectId },
    {
      project_id: projectId,
      document_type: documentType,
      document_name: documentName,
    },
    file,
  );
}

export async function downloadProjectDocument(
  documentId: string,
): Promise<string> {
  const { data } = await api.get(`/project-documents/${documentId}/download`);
  return data?.data?.downloadUrl ?? "";
}

export async function deleteProjectDocument(documentId: string): Promise<void> {
  await api.delete(`/project-documents/${documentId}`);
}
