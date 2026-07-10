import type { LucideIcon } from "lucide-react";

export interface DashboardStats {
  totalInvestor: number;
  totalInvestasi: number; // in IDR
  totalProject: number;
  totalInvestasiAktif: number;
  deltas?: {
    totalInvestor?: { value: string; direction: "up" | "down" };
    totalInvestasi?: { value: string; direction: "up" | "down" };
    totalProject?: { value: string; direction: "up" | "down" };
    totalInvestasiAktif?: { value: string; direction: "up" | "down" };
  };
}

export interface PerformancePoint {
  /** Bulan (label sumbu X), contoh: "Jan" */
  month: string;
  /** Nilai investasi masuk (Rp juta) */
  investasi: number;
  /** Return / imbal hasil (Rp juta) */
  return: number;
}

export type ActivityKind =
  | "investor_join"
  | "investment_created"
  | "project_launched"
  | "report_published"
  | "payout"
  | "system";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  description: string;
  /** ISO timestamp */
  timestamp: string;
}

export interface ActivityMeta {
  icon: LucideIcon;
  tone: "brand" | "success" | "warning" | "danger" | "muted";
}