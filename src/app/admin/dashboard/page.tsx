import type { Metadata } from "next";

import { DashboardView } from "@/features/admin-dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard · Koaci Admin",
  description: "Ringkasan investor, dana kelolaan, project, dan aktivitas sistem Koaci.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardView />;
}
