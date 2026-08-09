import type { ActivityAction } from "./types";

export const actionLabel: Record<ActivityAction, string> = {
  LOGIN: "Login",
  CREATE_USER: "Tambah Pengguna",
  UPDATE_USER: "Ubah Pengguna",
  DELETE_USER: "Hapus Pengguna",
  TOGGLE_USER_STATUS: "Toggle Status",
  CREATE_INVESTOR: "Tambah Investor",
  UPDATE_INVESTOR: "Ubah Investor",
  UPDATE_INVESTOR_STATUS: "Ubah Status Investor",
};

export function getActionLabel(action: string): string {
  return actionLabel[action as ActivityAction] ?? action;
}

export function actionBadgeClass(action: string): string {
  if (action.startsWith("DELETE")) {
    return "border-transparent bg-danger/10 text-danger";
  }
  if (action.startsWith("CREATE")) {
    return "border-transparent bg-success/15 text-success";
  }
  if (action.startsWith("UPDATE") || action.startsWith("TOGGLE")) {
    return "border-transparent bg-brand/10 text-brand";
  }
  return "border-transparent bg-muted text-muted-foreground";
}

export function roleBadgeClass(role: string): string {
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

/** "DD MMM YYYY, HH:mm" — deterministik agar aman untuk SSR. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}`;
}

export function roleDisplay(role: string): string {
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
