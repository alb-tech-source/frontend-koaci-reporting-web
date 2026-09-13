import api from "@/shared/lib/axios";
import type { ActivityLogParams, ActivityLogResponse } from "./types";

// Bentuk mentah item log dari GET /activity-logs
interface ApiActivityLog {
  activity_id: string;
  timestamp: string;
  user_id: string;
  action: string;
  entity_type: string;
  ip_address: string;
  user?: {
    firstname?: string;
    lastname?: string;
    role?: { role_name?: string };
  };
}

export async function fetchActivityLogs(params: ActivityLogParams): Promise<ActivityLogResponse> {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    );
    const { data } = await api.get("/activity-logs", { params: cleanParams });

    const rawItems = data?.data ?? [];

    const mappedItems = rawItems.map((log: ApiActivityLog) => ({
      id: log.activity_id,
      createdAt: log.timestamp,
      userName: `${log.user?.firstname ?? ""} ${log.user?.lastname ?? ""}`.trim() || "-",
      userId: log.user_id,
      userRole: log.user?.role?.role_name ?? "-",
      action: log.action,
      resource: log.entity_type,
      ip: log.ip_address,
    }));

    return {
      data: {
        items: mappedItems,
        total: data?.meta?.total ?? 0,
        page: data?.meta?.page ?? 1,
        totalPages: data?.meta?.totalPages ?? 1,
      },
    };
  } catch (error) {
    console.error("Gagal mengambil log aktivitas:", error);
    return { data: { items: [], total: 0, page: 1, totalPages: 1 } };
  }
}
