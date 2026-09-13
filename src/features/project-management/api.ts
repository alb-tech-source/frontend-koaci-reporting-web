import api from "@/shared/lib/axios"; // Pastikan path ini sesuai dengan instance axios Anda
import { uploadFile } from "@/shared/lib/upload";
import {
  type Project,
  type ProjectFormValues,
  type CompanyOption,
  mapApiProject,
  mapToApiProjectPayload,
} from "./types";

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get("/projects", { params: { limit: 100 } });

  const items = data?.data?.items ?? data?.data ?? data ?? [];

  return items.map(mapApiProject);
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
  const payload = mapToApiProjectPayload(values);
  const { data } = await api.put(`/projects/${projectId}`, payload);
  return mapApiProject(data?.data);
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

// Dapatkan Opsi Company untuk Form Dropdown
export async function fetchCompanyOptions(): Promise<CompanyOption[]> {
  const { data } = await api.get("/companies", {
    params: { limit: 100, status: "active" },
  });
  return (data?.data ?? []).map(
    (c: { company_id: string; company_name: string }) => ({
      companyId: c.company_id,
      companyName: c.company_name,
    }),
  );
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
