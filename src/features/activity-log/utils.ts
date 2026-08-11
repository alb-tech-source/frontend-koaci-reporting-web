import type { ActivityAction } from "./types";

export const actionLabel: Record<string, string> = {
  LOGIN_SUCCESS: "Login Berhasil",
  LOGIN_FAILED: "Login Gagal",
  LOGOUT: "Logout",
  USER_CREATE: "Tambah Pengguna",
  USER_UPDATE: "Ubah Pengguna",
  USER_DELETE: "Hapus Pengguna",
  INVESTOR_CREATE: "Tambah Investor",
  INVESTOR_UPDATE: "Ubah Investor",
  INVESTOR_STATUS_UPDATE: "Ubah Status Investor",
};

export function getActionLabel(action: string): string {
  return actionLabel[action] ?? action;
}

export function actionBadgeClass(action: string): string {
  // Gunakan .includes agar lebih fleksibel
  if (action.includes("DELETE") || action.includes("FAILED")) {
    return "border-transparent bg-danger/10 text-danger";
  }
  if (action.includes("CREATE") || action.includes("SUCCESS")) {
    return "border-transparent bg-success/15 text-success";
  }
  if (action.includes("UPDATE") || action.includes("TOGGLE")) {
    return "border-transparent bg-brand/10 text-brand";
  }
  return "border-transparent bg-muted text-muted-foreground";
}

export function roleBadgeClass(role?: string | null): string {
  if (!role) {
    return "border-transparent bg-muted/50 text-muted-foreground";
  }

  switch (role.toLowerCase()) {
    case "superadmin":
      return "border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400";
    case "bod":
      return "border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400";
    case "admin":
      return "border-transparent bg-brand/10 text-brand";
    case "investor":
      return "border-transparent bg-success/15 text-success";
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function formatDateTime(iso: string): string {
  if (!iso) return "-";
  
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}`;
}

export function roleDisplay(role?: string | null): string {
  if (!role) {
    return "Sistem";
  }

  switch (role.toLowerCase()) {
    case "superadmin":
      return "Super Admin";
    case "bod":
      return "BOD";
    case "admin":
      return "Admin";
    case "investor":
      return "Investor";
    default:
      return role;
  }
}