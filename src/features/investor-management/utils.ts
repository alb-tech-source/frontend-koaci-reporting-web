import type { InvestorStatus } from "./types";

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const statusLabel: Record<InvestorStatus, string> = {
  active: "Aktif",
  inactive: "Non-aktif",
  blacklist: "Blacklist",
};

export const statusBadgeVariant: Record<
  InvestorStatus,
  "active" | "cancelled"
> = {
  active: "active",
  inactive: "cancelled",
  blacklist: "cancelled",
};
export const INDONESIAN_BANKS = [
  "BCA",
  "BCA Syariah",
  "BNI",
  "BRI",
  "Mandiri",
  "Bank Syariah Indonesia (BSI)",
  "CIMB Niaga",
  "Permata",
  "Danamon",
  "Muamalat",
  "Lainnya",
] as const;

export const heirRelationOptions = [
  { value: "spouse", label: "Suami/Istri" },
  { value: "child", label: "Anak" },
  { value: "parent", label: "Orang Tua" },
  { value: "sibling", label: "Saudara" },
  { value: "other", label: "Lainnya" },
] as const;

export const emptyHeirData = {
  name: "",
  relation: "" as const,
  nik: "",
  address: "",
  accountNumber: "",
  bankName: "",
  phone: "",
};
