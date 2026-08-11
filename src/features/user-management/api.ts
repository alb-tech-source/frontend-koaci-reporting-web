import api from "@/shared/lib/axios";
import {
  mapApiUserToAppUser,
  type ApiUser,
  type AppUser,
  type Permission,
} from "./types";

function toPermissionIds(
  keys: string[],
  availablePermissions: Permission[],
): string[] {
  return keys
    .map((k) => availablePermissions.find((p) => p.key === k)?.id)
    .filter((id): id is string => Boolean(id));
}

export async function fetchUsers(page: number, limit = 10): Promise<AppUser[]> {
  try {
    const { data } = await api.get(`/users?page=${page}&limit=${limit}`);
    const items: ApiUser[] = data.data?.items ?? data.data ?? [];
    return items.map(mapApiUserToAppUser);
  } catch (error) {
    console.error("Gagal mengambil data dari GET /users:", error);
    
    return [];
  }
}

export async function fetchPermissions(): Promise<Permission[]> {
  const { data } = await api.get("/permissions/all");
  const list = data.data ?? data ?? [];
  return list.map((p: any) => ({
    id: p.permission_id ?? p.id,
    key: p.permission_key ?? p.key,
    label: p.permission_name ?? p.label ?? p.permission_key,
  }));
}

export async function createUser(
  payload: {
    firstname: string;
    lastname: string;
    email: string;
    role_name: string;
    permission_ids: string[];
    is_active: boolean;
  },
  availablePermissions: Permission[],
) {
  const { data } = await api.post("/users/", {
    ...payload,
    permission_ids: toPermissionIds(
      payload.permission_ids,
      availablePermissions,
    ),
  });
  return data;
}

export async function updateUser(
  id: string,
  payload: any,
  availablePermissions: Permission[],
) {
  const updatedPayload = { ...payload };
  if (updatedPayload.permission_ids) {
    updatedPayload.permission_ids = toPermissionIds(
      updatedPayload.permission_ids,
      availablePermissions,
    );
  }
  const { data } = await api.put(`/users/${id}`, updatedPayload);
  return data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

export async function toggleUserActivation(id: string, isActive: boolean) {
  const { data } = await api.patch(`/users/${id}/activate`, { isActive });
  return data;
}
