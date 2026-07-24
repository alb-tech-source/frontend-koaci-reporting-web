import type { UserRole, UserStatus } from "./types";

export const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  investor: "Investor",
  bod: "BOD",
};

export const statusLabel: Record<UserStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
};

export function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case "admin":
      return "border-transparent bg-brand/10 text-brand";
    case "investor":
      return "border-transparent bg-success/15 text-success";
    case "bod":
      return "border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400";
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