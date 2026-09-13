import api from "@/shared/lib/axios";
import { uploadFile } from "@/shared/lib/upload";
import type {
  ProjectReporting,
  ProjectReportingMedia,
  ReportingFormValues,
  ReportingMediaType,
  ReportingProjectOption,
  ReportingUpdateValues,
  MediaUploadValues,
} from "./types";

// Bentuk mentah respons /project-reportings (menampung variasi snake_case/camelCase)
interface ApiReporting {
  project_reporting_id?: string;
  id?: string;
  project_id?: string;
  report_date?: string;
  estimate_progress_percentage?: string | number;
  narative_summary?: string;
  narrativeSummary?: string;
  issues_blockers?: string;
  issuesBlockers?: string;
  next_week_plan?: string;
  nextWeekPlan?: string;
  fund_disbursed?: string | number;
  submitted_by?: string;
  updated_by?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  project?: ApiReportingProject;
  submitted?: ApiReportingUser;
  user?: ApiReportingUser;
  projectReportingMedia?: ApiReportingMedia[];
}

interface ApiReportingProject {
  project_id?: string;
  project_key?: string;
  company?: { company_name?: string };
}

interface ApiReportingUser {
  firstname?: string;
  lastname?: string;
}

interface ApiReportingMedia {
  project_reporting_media_id?: string;
  id?: string;
  project_reporting_id?: string;
  media_type?: string;
  media_name?: string;
  storage_provider?: string;
  object_key?: string;
  file_size_bytes?: string | number;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  user?: ApiReportingUser;
}

function mapReporting(raw: ApiReporting): ProjectReporting {
  const proj = raw.project || {};
  const comp = proj.company || {};
  const submitter = raw.submitted || raw.user || {};

  return {
    reportingId: raw.project_reporting_id || raw.id || "",
    projectId: raw.project_id || proj.project_id || "",
    projectKey: proj.project_key || "Tanpa Kode",
    companyName: comp.company_name || "Tanpa Perusahaan",
    reportDate: raw.report_date || new Date().toISOString(),
    estimateProgressPercentage:
      Number.parseFloat(String(raw.estimate_progress_percentage ?? 0)) || 0,
    narrativeSummary: raw.narative_summary || raw.narrativeSummary || "",
    issuesBlockers: raw.issues_blockers || raw.issuesBlockers || "",
    nextWeekPlan: raw.next_week_plan || raw.nextWeekPlan || "",
    fundDisbursed: Number.parseFloat(String(raw.fund_disbursed ?? 0)) || 0,
    submittedBy: raw.submitted_by || "",
    updatedBy: raw.updated_by || "",
    submittedByName:
      `${submitter.firstname || ""} ${submitter.lastname || ""}`.trim() ||
      "Sistem",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    projectReportingMedia: (raw.projectReportingMedia || []).map(mapMedia),
  };
}

function mapMedia(raw: ApiReportingMedia): ProjectReportingMedia {
  const usr = raw.user || {};
  return {
    mediaId: raw.project_reporting_media_id || raw.id || "",
    reportingId: raw.project_reporting_id || "",
    mediaType: (raw.media_type || "photo") as ReportingMediaType,
    mediaName: raw.media_name || "Media Tidak Dikenal",
    storageProvider: raw.storage_provider || "s3",
    objectKey: raw.object_key || "",
    fileSizeBytes: Number.parseInt(String(raw.file_size_bytes ?? 0), 10) || 0,
    mimeType: raw.mime_type || "application/octet-stream",
    uploadedBy: raw.uploaded_by || "",
    uploadedAt: raw.uploaded_at || new Date().toISOString(),
    uploaderName:
      `${usr.firstname || ""} ${usr.lastname || ""}`.trim() || "Sistem",
  };
}

// ----------------------------------------------------
// API CALLS
// ----------------------------------------------------

export async function fetchReportings(): Promise<ProjectReporting[]> {
  const { data } = await api.get("/project-reportings", {
    params: { page: 1, limit: 100 },
  });
  const items = data?.data?.items ?? data?.data ?? data ?? [];
  return items.map(mapReporting);
}

export async function fetchProjectOptions(): Promise<ReportingProjectOption[]> {
  const { data } = await api.get("/projects", {
    params: { page: 1, limit: 100, status: "open" },
  });
  const items: Array<{
    project_id?: string;
    id?: string;
    project_key?: string;
    projectKey?: string;
    company?: { company_name?: string; companyName?: string };
  }> = data?.data?.items ?? data?.data ?? data ?? [];
  return items
    .map(
      (p): ReportingProjectOption => ({
        projectId: p.project_id || p.id || "",
        projectKey: p.project_key || p.projectKey || "Tanpa Kode",
        companyName:
          p.company?.company_name ||
          p.company?.companyName ||
          "Tanpa Perusahaan",
      }),
    )
    .filter((p: ReportingProjectOption) => p.projectId !== "");
}

export async function createReporting(
  values: ReportingFormValues,
): Promise<ProjectReporting> {
  const { data } = await api.post("/project-reportings", values);
  return mapReporting(data?.data ?? data);
}

export async function updateReporting(
  id: string,
  values: ReportingUpdateValues,
): Promise<ProjectReporting> {
  const { data } = await api.put(`/project-reportings/${id}`, values);
  return mapReporting(data?.data ?? data);
}

export async function deleteReporting(id: string): Promise<void> {
  await api.delete(`/project-reportings/${id}`);
}

// ----------------------------------------------------
// MEDIA API CALLS
// ----------------------------------------------------

export async function fetchReportingMedia(
  reportingId: string,
): Promise<ProjectReportingMedia[]> {
  const { data } = await api.get(`/project-reportings/${reportingId}`);
  const report = mapReporting(data?.data ?? data);
  return report.projectReportingMedia;
}

export async function uploadReportingMedia(
  values: MediaUploadValues,
): Promise<void> {
  await uploadFile(
    "/project-reporting-media/presign",
    "/project-reporting-media",
    { project_reporting_id: values.project_reporting_id },
    {
      project_reporting_id: values.project_reporting_id,
      media_type: values.media_type,
      media_name: values.media_name,
    },
    values.file,
  );
}

export async function deleteReportingMedia(mediaId: string): Promise<void> {
  await api.delete(`/project-reporting-media/${mediaId}`);
}

export async function getMediaDownloadUrl(mediaId: string): Promise<string> {
  const { data } = await api.get(
    `/project-reporting-media/${mediaId}/download`,
  );
  return data?.data?.downloadUrl ?? data?.downloadUrl ?? "";
}
