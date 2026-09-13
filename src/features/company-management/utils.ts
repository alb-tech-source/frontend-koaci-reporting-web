import type { BadgeProps } from "@/shared/components/ui/badge";
import { CompanyStatus } from "./types";

export function getCompanyStatusLabel(status: CompanyStatus) {
  switch (status) {
    case "active": return "Valid / Aktif";
    case "inactive": return "Tidak Aktif";
    case "blacklist": return "Blacklist";
    default: return status;
  }
}

export function getCompanyStatusBadgeVariant(status: CompanyStatus): BadgeProps["variant"] {
  switch (status) {
    case "active": return "active";
    case "inactive": return "outline";
    case "blacklist": return "cancelled";
    default: return "outline";
  }
}