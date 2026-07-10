import {
  Activity,
  Banknote,
  FilePlus2,
  Rocket,
  UserPlus,
  Wallet,
} from "lucide-react";

import type { ActivityKind, ActivityMeta } from "./types";

export function formatIDR(amount: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace(".", ",")} Jt`;
    if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.round(hr / 24);
  return `${day} hari lalu`;
}

export const activityMeta: Record<ActivityKind, ActivityMeta> = {
  investor_join: { icon: UserPlus, tone: "brand" },
  investment_created: { icon: Wallet, tone: "success" },
  project_launched: { icon: Rocket, tone: "brand" },
  report_published: { icon: FilePlus2, tone: "warning" },
  payout: { icon: Banknote, tone: "success" },
  system: { icon: Activity, tone: "muted" },
};

export const toneBg: Record<ActivityMeta["tone"], string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  muted: "bg-muted text-muted-foreground",
};