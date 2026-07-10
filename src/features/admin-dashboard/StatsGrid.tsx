import { FolderKanban, TrendingUp, Users, Wallet } from "lucide-react";

import { StatCard } from "@/shared/components/ui/stat-card";

import type { DashboardStats } from "./types";
import { formatIDR, formatNumber } from "./utils";

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Investor"
        value={formatNumber(stats.totalInvestor)}
        delta={stats.deltas?.totalInvestor}
        icon={Users}
      />
      <StatCard
        label="Total Investasi"
        value={formatIDR(stats.totalInvestasi, { compact: true })}
        delta={stats.deltas?.totalInvestasi}
        icon={Wallet}
      />
      <StatCard
        label="Total Project"
        value={formatNumber(stats.totalProject)}
        delta={stats.deltas?.totalProject}
        icon={FolderKanban}
      />
      <StatCard
        label="Investasi Aktif"
        value={formatNumber(stats.totalInvestasiAktif)}
        delta={stats.deltas?.totalInvestasiAktif}
        icon={TrendingUp}
      />
    </div>
  );
}
