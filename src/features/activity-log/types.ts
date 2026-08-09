export const ACTIVITY_ACTIONS = [
  "LOGIN",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "TOGGLE_USER_STATUS",
  "CREATE_INVESTOR",
  "UPDATE_INVESTOR",
  "UPDATE_INVESTOR_STATUS",
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
