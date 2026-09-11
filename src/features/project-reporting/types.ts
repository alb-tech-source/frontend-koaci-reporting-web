export type ReportingMediaType = "photo" | "video" | "document";

export interface ProjectReportingMedia {
  mediaId: string;
  reportingId: string;
  mediaType: ReportingMediaType;
  mediaName: string;
  storageProvider: string;
  objectKey: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  uploaderName: string;
}

export interface ProjectReporting {
  reportingId: string;
  projectId: string;
  projectKey: string;
  companyName: string;
  reportDate: string;
  estimateProgressPercentage: number;
  narrativeSummary: string;
  issuesBlockers: string;
  nextWeekPlan: string;
  fundDisbursed: number;
  submittedBy: string;
  updatedBy: string;
  submittedByName: string;
  createdAt: string;
  updatedAt: string;
  projectReportingMedia: ProjectReportingMedia[];
}

export interface ReportingFormValues {
  project_id: string;
  report_date: string;
  estimate_progress_percentage: number;
  narative_summary: string;
  issues_blockers?: string;
  next_week_plan?: string;
  fund_disbursed?: number;
}

export interface ReportingUpdateValues {
  estimate_progress_percentage?: number;
  narative_summary?: string;
  issues_blockers?: string;
  next_week_plan?: string;
  fund_disbursed?: number;
  report_date?: string;
}

export interface MediaUploadValues {
  project_reporting_id: string;
  media_type: ReportingMediaType;
  media_name: string;
  file: File;
  storage_provider?: string;
}

export interface ReportingProjectOption {
  projectId: string;
  projectKey: string;
  companyName: string;
}