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
  pending: "Menunggu",
  inactive: "Non-aktif",
};

export const statusBadgeVariant: Record<
  InvestorStatus,
  "active" | "pending" | "cancelled"
> = {
  active: "active",
  pending: "pending",
  inactive: "cancelled",
};