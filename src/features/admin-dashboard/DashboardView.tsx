"use client";

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { PageSkeleton } from "@/shared/components/ui/feedback";

import { ActivityFeed } from "./ActivityFeed";
import { PerformanceChart } from "./PerformanceChart";
import { StatsGrid } from "./StatsGrid";
import { fetchDashboardData } from "./api";

const dashboardQuery = queryOptions({
  queryKey: ["admin", "dashboard"],
  queryFn: fetchDashboardData,
});

export function DashboardView() {
  return (
    <ClientGuard>
      <Suspense fallback={<PageSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ClientGuard>
  );
}

function DashboardContent() {
  const { data } = useSuspenseQuery(dashboardQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan performa investasi dan aktivitas sistem.
        </p>
      </div>

      <StatsGrid stats={data.stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <PerformanceChart data={data.performance} />
        </div>
        <div className="lg:col-span-3">
          <ActivityFeed items={data.activity} />
        </div>
      </div>
    </div>
  );
}
