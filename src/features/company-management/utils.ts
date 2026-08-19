import type { CompanyStatus } from "./types";

export const companyStatusLabel: Record<CompanyStatus, string> = {
  active: "Valid / Aktif",
  inactive: "Tidak Aktif",
  blacklist: "Blacklist",
};

export const companyStatusBadgeVariant: Record<
  CompanyStatus,
  "success" | "outline" | "danger" // Disesuaikan dengan komponen Badge yang tersedia
> = {
  active: "success",
  inactive: "outline",
  blacklist: "danger",
};

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