import type { Metadata } from "next";

import { StatsGrid } from "@/features/admin-dashboard/StatsGrid";
import { PerformanceChart } from "@/features/admin-dashboard/PerformanceChart";
import { ActivityFeed } from "@/features/admin-dashboard/ActivityFeed";


import { 
  fetchDashboardStats, 
  fetchPerformanceSeries, 
  fetchRecentActivity 
} from "@/features/admin-dashboard/dummy-data";

export const metadata: Metadata = {
  title: "Dashboard · Koaci Admin",
  description: "Ringkasan investor, dana kelolaan, project, dan aktivitas sistem Koaci.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  
  const statsData = await fetchDashboardStats();
  const chartData = await fetchPerformanceSeries();
  const activityData = await fetchRecentActivity();

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Ringkasan performa investasi dan aktivitas sistem.
          </p>
        </div>
        
        {/* 4. Masukkan data hasil resolve ke properti komponen */}
        <StatsGrid stats={statsData} />
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <PerformanceChart data={chartData} />
          </div>
          <div className="lg:col-span-3">
            <ActivityFeed items={activityData} />
          </div>
        </div>
      </div>
  );
}