import api from "@/shared/lib/axios";
import type {
  ProjectReporting,
  ProjectReportingMedia,
  ReportingFormValues,
  ReportingProjectOption,
  ReportingUpdateValues,
  MediaUploadValues,
} from "./types";

function mapReporting(raw: any): ProjectReporting {
  const proj = raw.project || {};
  const comp = proj.company || {};
  const submitter = raw.submitted || raw.user || {};

  return {
    reportingId: raw.project_reporting_id || raw.id || "",
    projectId: raw.project_id || proj.project_id || "",
    projectKey: proj.project_key || "Tanpa Kode",
    companyName: comp.company_name || "Tanpa Perusahaan",
    reportDate: raw.report_date || new Date().toISOString(),
    estimateProgressPercentage: Number.parseFloat(raw.estimate_progress_percentage) || 0,
    narrativeSummary: raw.narative_summary || raw.narrativeSummary || "",
    issuesBlockers: raw.issues_blockers || raw.issuesBlockers || "",
    nextWeekPlan: raw.next_week_plan || raw.nextWeekPlan || "",
    fundDisbursed: Number.parseFloat(raw.fund_disbursed) || 0,
    submittedBy: raw.submitted_by || "",
    updatedBy: raw.updated_by || "",
    submittedByName: `${submitter.firstname || ""} ${submitter.lastname || ""}`.trim() || "Sistem",
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    projectReportingMedia: (raw.projectReportingMedia || []).map(mapMedia),
  };
}

function mapMedia(raw: any): ProjectReportingMedia {
  const usr = raw.user || {};
  return {
    mediaId: raw.project_reporting_media_id || raw.id || "",
    reportingId: raw.project_reporting_id || "",
    mediaType: raw.media_type || "photo",
    mediaName: raw.media_name || "Media Tidak Dikenal",
    storageProvider: raw.storage_provider || "s3",
    objectKey: raw.object_key || "",
    fileSizeBytes: Number.parseInt(raw.file_size_bytes) || 0,
    mimeType: raw.mime_type || "application/octet-stream",
    uploadedBy: raw.uploaded_by || "",
    uploadedAt: raw.uploaded_at || new Date().toISOString(),
    uploaderName: `${usr.firstname || ""} ${usr.lastname || ""}`.trim() || "Sistem",
  };
}

// ----------------------------------------------------
// API CALLS
// ----------------------------------------------------

export async function fetchReportings(): Promise<ProjectReporting[]> {
  const { data } = await api.get("/project-reportings", { params: { page: 1, limit: 100 } });
  const items = data?.data?.items ?? data?.data ?? data ?? [];
  return items.map(mapReporting);
}

export async function fetchProjectOptions(): Promise<ReportingProjectOption[]> {
  const { data } = await api.get("/projects", { params: { page: 1, limit: 100 } });
  const items = data?.data?.items ?? data?.data ?? data ?? [];
  return items
    .map((p: any): ReportingProjectOption => ({
      projectId: p.project_id || p.id || "",
      projectKey: p.project_key || p.projectKey || "Tanpa Kode",
      companyName: p.company?.company_name || p.company?.companyName || "Tanpa Perusahaan",
    }))
    .filter((p: ReportingProjectOption) => p.projectId !== "");
}

export async function createReporting(values: ReportingFormValues): Promise<ProjectReporting> {
  const { data } = await api.post("/project-reportings", values);
  return mapReporting(data?.data ?? data);
}

export async function updateReporting(id: string, values: ReportingUpdateValues): Promise<ProjectReporting> {
  const { data } = await api.put(`/project-reportings/${id}`, values);
  return mapReporting(data?.data ?? data);
}

export async function deleteReporting(id: string): Promise<void> {
  await api.delete(`/project-reportings/${id}`);
}

// ----------------------------------------------------
// MEDIA API CALLS
// ----------------------------------------------------

export async function fetchReportingMedia(reportingId: string): Promise<ProjectReportingMedia[]> {
  const { data } = await api.get(`/project-reportings/${reportingId}`);
  const report = mapReporting(data?.data ?? data);
  return report.projectReportingMedia;
}

export async function uploadReportingMedia(values: MediaUploadValues): Promise<void> {
  const form = new FormData();
  form.append("project_reporting_id", values.project_reporting_id);
  form.append("media_type", values.media_type);
  form.append("media_name", values.media_name);
  form.append("file", values.file);
  if (values.storage_provider) {
    form.append("storage_provider", values.storage_provider);
  }

  await api.post("/project-reporting-media", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteReportingMedia(mediaId: string): Promise<void> {
  await api.delete(`/project-reporting-media/${mediaId}`);
}

export async function getMediaDownloadUrl(mediaId: string): Promise<string> {
  const { data } = await api.get(`/project-reporting-media/${mediaId}/download`);
  return data?.data?.downloadUrl ?? data?.downloadUrl ?? "";
}