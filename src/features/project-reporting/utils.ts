import type { ReportingMediaType } from "./types";

export function progressLabel(pct: number): string {
  if (pct >= 100) return "Selesai";
  if (pct >= 75) return "Hampir Selesai";
  if (pct >= 50) return "Setengah Jalan";
  if (pct >= 25) return "Berjalan";
  return "Awal";
}

export function progressIndicatorClass(pct: number): string {
  if (pct >= 100) return "[&>div]:bg-success";
  if (pct >= 60) return "[&>div]:bg-brand";
  if (pct >= 30) return "[&>div]:bg-warning";
  return "[&>div]:bg-danger";
}

export const mediaTypeLabel: Record<ReportingMediaType, string> = {
  photo: "Foto",
  video: "Video",
  document: "Dokumen",
};

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}