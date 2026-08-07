import api from "@/shared/lib/axios";
import { mapApiUserToAppUser, type ApiUser, type AppUser, type Permission } from "./types";
import { PERMISSION_UUID_MAP } from "./permission-map";

function toPermissionIds(keys: string[]): string[] {
  return keys.map((k) => PERMISSION_UUID_MAP[k]).filter(Boolean);
}

export async function fetchUsers(page: number, limit = 10): Promise<AppUser[]> {
  const { data } = await api.get(`/users?page=${page}&limit=${limit}`);
  const items: ApiUser[] = data.data?.items ?? data.data ?? [];
  return items.map(mapApiUserToAppUser);
}

export async function fetchPermissions(): Promise<Permission[]> {
  try {
    const { data } = await api.get("/permissions");
    const list = data.data ?? data ?? [];
    return list.map((p: any) => ({
      key: p.permission_key ?? p.key,
      label: p.permission_name ?? p.label ?? p.permission_key,
    }));
  } catch {
    return [
      { key: "users:read",         label: "Lihat Data Pengguna" },
      { key: "users:create",       label: "Tambah Pengguna" },
      { key: "users:update",       label: "Ubah Data Pengguna" },
      { key: "users:delete",       label: "Hapus Pengguna" },
      { key: "users:manage_roles", label: "Kelola Role & Izin" },
    ];
  }
}

export async function createUser(payload: {
  firstname: string;
  lastname: string;
  email: string;
  role_name: string;
  permission_ids: string[];
  is_active: boolean;
}) {
  const { data } = await api.post("/users/", {
    ...payload,
    permission_ids: toPermissionIds(payload.permission_ids),
  });
  return data;
}

export async function updateUser(id: string, payload: any) {
  const updatedPayload = { ...payload };
  if (updatedPayload.permission_ids) {
    updatedPayload.permission_ids = toPermissionIds(updatedPayload.permission_ids);
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