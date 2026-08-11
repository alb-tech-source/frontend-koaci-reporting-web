import api from "@/shared/lib/axios";
import type { ActivityLogParams, ActivityLogResponse } from "./types";

export async function fetchActivityLogs(
  params: ActivityLogParams
): Promise<ActivityLogResponse> {
  try {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== "")
    );
    const { data } = await api.get("/activity-logs", { params: cleanParams });

    const rawItems = data?.data?.items ?? data?.data ?? data ?? [];

    const mappedItems = rawItems.map((log: any) => ({
      id: log.id || log.activity_id || Math.random().toString(),
      createdAt: log.created_at || log.createdAt || "",
      userName: log.user_name || log.userName || log.user?.firstname || "-",
      userId: log.user_id || log.userId || "-",
      userRole: log.user_role || log.role || log.userRole || null,
      action: log.action || "-",
      resource: log.resource || log.entity_type || log.entityType || "-",
      ip: log.ip_address || log.ipAddress || log.ip || "-",
    }));

    return {
      data: {
        items: mappedItems, // Gunakan data yang sudah dipetakan
        total: data?.data?.meta?.total ?? data?.data?.total ?? 0,
        page: data?.data?.meta?.page ?? data?.data?.page ?? 1,
        totalPages: data?.data?.meta?.totalPages ?? data?.data?.totalPages ?? 1,
      },
    };
  } catch (error) {
    console.error("Gagal mengambil log aktivitas:", error);
    return { data: { items: [], total: 0, page: 1, totalPages: 1 } };
  }
}
