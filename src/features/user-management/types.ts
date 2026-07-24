export type UserRole = "admin" | "investor" | "bod";
export type UserStatus = "active" | "inactive";

export const PERMISSIONS = [
  { key: "users:read", label: "Lihat Data Pengguna" },
  { key: "users:create", label: "Tambah Pengguna" },
  { key: "users:update", label: "Ubah Data Pengguna" },
  { key: "users:delete", label: "Hapus Pengguna" },
  { key: "users:manage_roles", label: "Kelola Role & Izin" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export interface ApiUser {
  user_id?: string;
  id?: string;
  firstname: string;
  lastname: string;
  email: string;
  is_active: boolean;
  last_login_at: string | null;
  role?: { 
    role_name: UserRole; 
    rolePermissions?: { permission: { permission_key: PermissionKey } }[] 
  };
  role_name?: string;
  permission_ids?: PermissionKey[];
}

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  permissions: PermissionKey[];
  lastLoginAt: string | null;
}

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  permissions: PermissionKey[];
  activate: boolean;
}

export function mapApiUserToAppUser(u: ApiUser): AppUser {
  return {
    id: String(u.user_id || u.id || ""), 
    firstName: u.firstname || "",
    lastName: u.lastname || "",
    email: u.email || "",

    role: (u.role?.role_name || u.role_name || "investor") as UserRole,
    
    status: u.is_active ? "active" : "inactive",
    
    permissions: u.role?.rolePermissions
      ? u.role.rolePermissions.map((rp) => rp.permission?.permission_key).filter((k): k is PermissionKey => Boolean(k))
      : (u.permission_ids || []), 
      
    lastLoginAt: u.last_login_at || null,
  };
}