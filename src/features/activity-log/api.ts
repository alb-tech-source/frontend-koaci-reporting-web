import api from "@/shared/lib/axios";
import { dummyActivityLogs } from "./dummy-data"; // Pastikan file ini ada
import type { ActivityLogParams, ActivityLogResponse } from "./types";

export async function fetchActivityLogs(
  params: ActivityLogParams
): Promise<ActivityLogResponse> {

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );
  const { data } = await api.get("/activity-logs", { params: cleanParams });
  return data;
  

  // ==========================================
  // OPSI 2: DUMMY DATA (Untuk testing UI)
  // ==========================================
  /*
  const { page, limit = 20, search, action, startDate, endDate } = params;

  // Simulasi delay jaringan agar skeleton/loading state UI bisa terlihat berfungsi
  await new Promise((resolve) => setTimeout(resolve, 600));

  const q = search?.trim().toLowerCase() ?? "";
  const filtered = dummyActivityLogs.filter((log) => {
    if (q && !log.userName.toLowerCase().includes(q)) return false;
    if (action && log.action !== action) return false;
    const day = log.createdAt.slice(0, 10);
    if (startDate && day < startDate) return false;
    if (endDate && day > endDate) return false;
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(Math.max(1, page), totalPages);

  return {
    data: {
      items: filtered.slice((current - 1) * limit, current * limit),
      total,
      page: current,
      totalPages,
    },
  };
  */
}