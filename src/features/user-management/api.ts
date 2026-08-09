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
  const { data } = await api.get(`/users?page=${page}&limit=${limit}`);
  const items: ApiUser[] = data.data?.items ?? data.data ?? [];
  return items.map(mapApiUserToAppUser);
}

export async function fetchPermissions(): Promise<Permission[]> {
  try {
    const { data } = await api.get("/permissions/all");
    const list = data.data ?? data ?? [];
    return list.map((p: any) => ({
      id: p.permission_id ?? p.id ?? p.permission_key, // Wajib ada ID untuk mapping
      key: p.permission_key ?? p.key,
      label: p.permission_name ?? p.label ?? p.permission_key,
    }));
  } catch {
    return [
      {
        id: "1d974091-8057-4a32-970a-...",
        key: "users:read",
        label: "Lihat Data Pengguna",
      },
      {
        id: "2e3e53f4-de4e-4cf4-982b-...",
        key: "users:create",
        label: "Tambah Pengguna",
      },
      {
        id: "8f355d73-9294-4fa7-9d2a-...",
        key: "users:update",
        label: "Ubah Data Pengguna",
      },
      {
        id: "901f2af4-71ae-4a98-9a3d-...",
        key: "users:delete",
        label: "Hapus Pengguna",
      },
      {
        id: "b480ba4f-0569-43d1-9a6e-...",
        key: "users:manage_roles",
        label: "Kelola Role & Izin",
      },
    ];
  }
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
