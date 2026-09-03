import api from "@/shared/lib/axios"; // Pastikan path ini sesuai dengan instance axios Anda
import { 
  type ProjectListParams, 
  type ProjectListResponse, 
  type Project, 
  type ProjectFormValues, 
  type CompanyOption,
  mapApiProject,
  mapToApiProjectPayload
} from "./types";

export async function fetchProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
  const { data } = await api.get("/projects", { params });
  return {
    data: {
      items: (data?.data ?? []).map(mapApiProject),
      meta: data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 }
    }
  };
}

export async function fetchProject(projectId: string): Promise<Project> {
  const { data } = await api.get(`/projects/${projectId}`);
  return mapApiProject(data?.data);
}

export async function createProject(values: ProjectFormValues): Promise<Project> {
  const payload = mapToApiProjectPayload(values);
  const { data } = await api.post("/projects", payload);
  return mapApiProject(data?.data);
}

export async function updateProject(projectId: string, values: ProjectFormValues): Promise<Project> {
  const payload = mapToApiProjectPayload(values);
  const { data } = await api.put(`/projects/${projectId}`, payload);
  return mapApiProject(data?.data);
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

// Dapatkan Opsi Company untuk Form Dropdown
export async function fetchCompanyOptions(): Promise<CompanyOption[]> {
  const { data } = await api.get("/companies", { params: { limit: 100 } });
  return (data?.data ?? []).map((c: any) => ({
    companyId: c.company_id,
    companyName: c.company_name
  }));
}

// --- PROJECT DOCUMENTS API ---
export async function fetchProjectDocuments(projectId: string) {
  const { data } = await api.get(`/project-documents/project/${projectId}`);
  return data?.data ?? [];
}

export async function uploadProjectDocument(projectId: string, documentType: string, documentName: string, file: File) {
  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("document_type", documentType);
  formData.append("document_name", documentName);
  formData.append("storage_provider", "cloudflare");
  formData.append("file", file);
  await api.post("/project-documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function downloadProjectDocument(documentId: string): Promise<string> {
  const { data } = await api.get(`/project-documents/${documentId}/download`);
  return data?.data?.downloadUrl ?? "";
}

export async function deleteProjectDocument(documentId: string): Promise<void> {
  await api.delete(`/project-documents/${documentId}`);
}