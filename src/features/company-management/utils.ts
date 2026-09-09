import { CompanyStatus } from "./types";

export function getCompanyStatusLabel(status: CompanyStatus) {
  switch (status) {
    case "active": return "Valid / Aktif";
    case "inactive": return "Tidak Aktif";
    case "blacklist": return "Blacklist";
    default: return status;
  }
}

export function getCompanyStatusBadgeVariant(status: CompanyStatus) {
  switch (status) {
    case "active": return "success";
    case "inactive": return "outline";
    case "blacklist": return "danger";
    default: return "outline";
  }
}