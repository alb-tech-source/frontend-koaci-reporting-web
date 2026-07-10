import type { ActivityItem, DashboardStats, PerformancePoint } from "./types";

/**
 * Dummy data source. Replace these functions with real fetchers
 * (server functions / React Query) — the shape is the contract.
 */

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return {
    totalInvestor: 1284,
    totalInvestasi: 12_400_000_000,
    totalProject: 42,
    totalInvestasiAktif: 987,
    deltas: {
      totalInvestor: { value: "+124 bulan ini", direction: "up" },
      totalInvestasi: { value: "+8,2%", direction: "up" },
      totalProject: { value: "+3 baru", direction: "up" },
      totalInvestasiAktif: { value: "-1,4%", direction: "down" },
    },
  };
}

export async function fetchPerformanceSeries(): Promise<PerformancePoint[]> {
  return [
    { month: "Jan", investasi: 620, return: 42 },
    { month: "Feb", investasi: 780, return: 55 },
    { month: "Mar", investasi: 940, return: 68 },
    { month: "Apr", investasi: 880, return: 61 },
    { month: "Mei", investasi: 1120, return: 82 },
    { month: "Jun", investasi: 1340, return: 96 },
    { month: "Jul", investasi: 1210, return: 88 },
    { month: "Agu", investasi: 1480, return: 108 },
    { month: "Sep", investasi: 1620, return: 121 },
    { month: "Okt", investasi: 1780, return: 134 },
    { month: "Nov", investasi: 1910, return: 146 },
    { month: "Des", investasi: 2100, return: 162 },
  ];
}

export async function fetchRecentActivity(limit = 5): Promise<ActivityItem[]> {
  const items: ActivityItem[] = [
    {
      id: "a1",
      kind: "investor_join",
      description: "Investor baru: Ahmad Fauzi menyelesaikan verifikasi KYC.",
      timestamp: minutesAgo(6),
    },
    {
      id: "a2",
      kind: "investment_created",
      description: "Siti Nurhaliza berinvestasi Rp 10.000.000 pada Sukuk SR-021.",
      timestamp: minutesAgo(42),
    },
    {
      id: "a3",
      kind: "project_launched",
      description: "Project baru diluncurkan: Pembiayaan UMKM Halal Batch #12.",
      timestamp: hoursAgo(2),
    },
    {
      id: "a4",
      kind: "report_published",
      description: "Laporan bulanan September 2025 dipublikasikan ke 1.284 investor.",
      timestamp: hoursAgo(5),
    },
    {
      id: "a5",
      kind: "payout",
      description: "Distribusi bagi hasil Rp 148.500.000 berhasil diproses.",
      timestamp: hoursAgo(9),
    },
    {
      id: "a6",
      kind: "system",
      description: "Sinkronisasi data harian selesai tanpa kendala.",
      timestamp: hoursAgo(14),
    },
  ];
  return items.slice(0, limit);
}

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60_000).toISOString();
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}