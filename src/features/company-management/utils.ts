import type { LegalStatus } from "./types";

export const legalStatusLabel: Record<LegalStatus, string> = {
  valid: "Valid",
  expired: "Expired",
  pending_renewal: "Menunggu Perpanjangan",
};

export const legalStatusBadgeVariant: Record<
  LegalStatus,
  "active" | "pending" | "cancelled"
> = {
  valid: "active",
  expired: "cancelled",
  pending_renewal: "pending",
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