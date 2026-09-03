import type { ProjectStatus } from "./types";

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDateID(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export const projectStatusBadgeClass: Record<ProjectStatus, string> = {
  open: "border-transparent bg-brand/10 text-brand",
  closed: "border-transparent bg-muted text-muted-foreground",
  target_achieved: "border-transparent bg-success/15 text-success",
  cancelled: "border-transparent bg-danger/15 text-danger",
};

export function fundingProgress(collected: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.max(0, Math.round((collected / target) * 100)));
}