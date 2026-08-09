import api from "@/shared/lib/axios";

export async function fetchAllPermissions() {
  const { data } = await api.get("/permissions");
  return data.data as { permission_id: string; permission_key: string }[];
}

export async function fetchRolePermissions(roleName: string) {
  const { data } = await api.get(`/roles/${roleName}/permissions`);
  return data.data;
}

export async function updateRolePermissions(roleName: string, permissionIds: string[]) {
  const { data } = await api.put(`/roles/${roleName}/permissions`, { permission_ids: permissionIds });
  return data;
}