import type { UserRole, UserStatus } from "./types";

export const roleLabel: Record<UserRole, string> = {
  superadmin: "Super Admin", 
  admin: "Admin",
  bod: "BOD",
  investor: "Investor",
  user: "User",              
};

export const statusLabel: Record<UserStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
};

export function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case "superadmin":
      return "border-transparent bg-destructive/15 text-destructive"; 
    case "admin":
      return "border-transparent bg-brand/10 text-brand";
    case "investor":
      return "border-transparent bg-success/15 text-success";
    case "bod":
      return "border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400";
    case "user":
      return "border-border bg-muted/50 text-muted-foreground";     
    default:
      return "border-transparent bg-accent text-accent-foreground"; 
  }
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Belum pernah";
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (abs < min) return "Baru saja";
  if (abs < hour) return `${Math.floor(abs / min)} menit lalu`;
  if (abs < day) return `${Math.floor(abs / hour)} jam lalu`;
  if (abs < 7 * day) return `${Math.floor(abs / day)} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}