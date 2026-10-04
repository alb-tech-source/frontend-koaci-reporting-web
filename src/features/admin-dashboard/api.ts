import { fetchInvestments } from "@/features/investment-management/api";
import type { ProjectInvestment } from "@/features/investment-management/types";
import { fetchInvestors } from "@/features/investor-management/api";
import type { Investor } from "@/features/investor-management/types";
import { fetchProjects } from "@/features/project-management/api";
import type { Project } from "@/features/project-management/types";
import { fetchSettlements } from "@/features/settlement/api";
import type { ProjectSettlement } from "@/features/settlement/types";
import { hasPermission } from "@/shared/lib/auth";
import { formatIDR } from "@/shared/lib/format";

import type {
  ActivityItem,
  DashboardData,
  DashboardStats,
  PerformancePoint,
} from "./types";
import { formatNumber } from "./utils";

const MONTH_LABELS = [
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
const MONTHS_SHOWN = 12;
const ACTIVITY_LIMIT = 5;
// Investasi dihitung aktif selama proyeknya belum ditutup/dibatalkan
const ACTIVE_PROJECT_STATUSES = new Set(["open", "target_achieved"]);

/** Kunci bulan lokal "YYYY-M"; null bila tanggal kosong/tidak valid. */
function monthKey(iso: string): string | null {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/**
 * Return investor pada settlement = bagian investor + total kompensasi
 * (sama dengan jumlah total_profit seluruh investor di backend).
 */
function settlementReturn(s: ProjectSettlement): number {
  return (
    (Number(s.investorPortionAmount) || 0) + (Number(s.compensationTotal) || 0)
  );
}

function buildStats(
  investors: Investor[],
  investments: ProjectInvestment[],
  projects: Project[],
): DashboardStats {
  const thisMonth = monthKey(new Date().toISOString());
  const isThisMonth = (iso: string) => monthKey(iso) === thisMonth;

  const newInvestors = investors.filter((i) => isThisMonth(i.joinedAt)).length;
  const newProjects = projects.filter((p) => isThisMonth(p.createdAt)).length;
  const investedThisMonth = investments
    .filter((i) => isThisMonth(i.createdAt))
    .reduce((sum, i) => sum + i.amount, 0);

  return {
    totalInvestor: investors.length,
    totalInvestasi: investments.reduce((sum, i) => sum + i.amount, 0),
    totalProject: projects.length,
    totalInvestasiAktif: investments.filter((i) =>
      ACTIVE_PROJECT_STATUSES.has(i.project.status),
    ).length,
    deltas: {
      ...(newInvestors > 0 && {
        totalInvestor: {
          value: `+${formatNumber(newInvestors)} bulan ini`,
          direction: "up" as const,
        },
      }),
      ...(investedThisMonth > 0 && {
        totalInvestasi: {
          value: `+${formatIDR(investedThisMonth, { compact: true })} bulan ini`,
          direction: "up" as const,
        },
      }),
      ...(newProjects > 0 && {
        totalProject: {
          value: `+${formatNumber(newProjects)} bulan ini`,
          direction: "up" as const,
        },
      }),
    },
  };
}

function buildPerformance(
  investments: ProjectInvestment[],
  settlements: ProjectSettlement[],
): PerformancePoint[] {
  const now = new Date();
  const points: PerformancePoint[] = [];
  const indexByMonth = new Map<string, number>();

  for (let offset = MONTHS_SHOWN - 1; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    indexByMonth.set(`${d.getFullYear()}-${d.getMonth()}`, points.length);
    points.push({ month: MONTH_LABELS[d.getMonth()], investasi: 0, return: 0 });
  }

  for (const inv of investments) {
    const idx = indexByMonth.get(monthKey(inv.createdAt) ?? "");
    if (idx !== undefined) points[idx].investasi += inv.amount;
  }
  for (const s of settlements) {
    if (s.status !== "approved") continue;
    // Settlement approved tidak bisa diubah lagi, jadi updatedAt = waktu persetujuan
    const idx = indexByMonth.get(monthKey(s.updatedAt) ?? "");
    if (idx !== undefined) points[idx].return += settlementReturn(s);
  }

  // Grafik memakai satuan juta rupiah
  const toMillions = (value: number) => Math.round(value / 10_000) / 100;
  return points.map((p) => ({
    ...p,
    investasi: toMillions(p.investasi),
    return: toMillions(p.return),
  }));
}

function buildActivity(
  investments: ProjectInvestment[],
  projects: Project[],
  settlements: ProjectSettlement[],
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const inv of investments) {
    const { firstname, lastname } = inv.investor.user;
    const name = `${firstname} ${lastname}`.trim() || "Investor";
    items.push({
      id: `investment-${inv.projectInvestmentId}`,
      kind: "investment_created",
      description: `${name} berinvestasi ${formatIDR(inv.amount)} pada ${inv.project.projectKey}.`,
      timestamp: inv.createdAt,
    });
  }
  for (const p of projects) {
    items.push({
      id: `project-${p.projectId}`,
      kind: "project_launched",
      description: `Project baru: ${p.projectKey} (${p.companyName ?? "-"}).`,
      timestamp: p.createdAt,
    });
  }
  for (const s of settlements) {
    if (s.status !== "approved") continue;
    items.push({
      id: `settlement-${s.settlementId}`,
      kind: "payout",
      description: `Settlement ${s.projectKey} disetujui, bagi hasil investor ${formatIDR(Math.round(settlementReturn(s)))}.`,
      timestamp: s.updatedAt,
    });
  }

  return items
    .filter((item) => monthKey(item.timestamp) !== null)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, ACTIVITY_LIMIT);
}

/**
 * Dashboard diturunkan dari endpoint list yang sudah ada (backend belum punya
 * endpoint ringkasan). Resource yang tidak boleh dibaca user dilewati.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const [investors, investments, projects, settlements] = await Promise.all([
    hasPermission("investors:read:any") ? fetchInvestors() : [],
    hasPermission("project_investments:read:any") ? fetchInvestments() : [],
    hasPermission("projects:read:any") ? fetchProjects() : [],
    hasPermission("project_settlements:read:any") ? fetchSettlements() : [],
  ]);

  return {
    stats: buildStats(investors, investments, projects),
    performance: buildPerformance(investments, settlements),
    activity: buildActivity(investments, projects, settlements),
  };
}
