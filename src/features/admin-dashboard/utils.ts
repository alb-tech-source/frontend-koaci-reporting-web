import {
  Activity,
  Banknote,
  FilePlus2,
  Rocket,
  UserPlus,
  Wallet,
} from "lucide-react";

import type { ActivityKind, ActivityMeta } from "./types";

export function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
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