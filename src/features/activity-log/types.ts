export const ACTIVITY_ACTIONS = [
  "USER_LOGIN",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "USER_TOGGLE_STATUS",
  "INVESTOR_CREATE",
  "INVESTOR_UPDATE",
  "INVESTOR_STATUS_UPDATE",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  ip: string;
  createdAt: string;
}

export interface ActivityLogResponse {
  data: {
    items: ActivityLog[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface ActivityLogParams {
  page: number;
  limit?: number;
  search?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}
