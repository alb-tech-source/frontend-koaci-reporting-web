export type UserRole = "superadmin" | "admin" | "investor" | "bod" | "user";
export type UserStatus = "active" | "inactive";

export const PERMISSIONS_FALLBACK = [
  // COMPANIES
  { key: "companies:create:any", label: "Buat Perusahaan" },
  { key: "companies:read:any", label: "Lihat Semua Perusahaan" },
  { key: "companies:update:any", label: "Edit Perusahaan" },
  { key: "companies:delete:any", label: "Hapus Perusahaan" },
  { key: "company_documents:upload:any", label: "Unggah Dok. Perusahaan" },
  { key: "company_documents:read:any", label: "Lihat Dok. Perusahaan" },
  { key: "company_documents:update:any", label: "Edit Dok. Perusahaan" },
  { key: "company_documents:download:any", label: "Unduh Dok. Perusahaan" },
  { key: "company_documents:delete:any", label: "Hapus Dok. Perusahaan" },

  // PROJECTS
  { key: "projects:create:any", label: "Buat Proyek" },
  { key: "projects:read:any", label: "Lihat Semua Proyek" },
  { key: "projects:update:any", label: "Edit Proyek" },
  { key: "projects:delete:any", label: "Hapus Proyek" },
  { key: "project_documents:upload:any", label: "Unggah Dok. Proyek" },
  { key: "project_documents:read:any", label: "Lihat Dok. Proyek" },
  { key: "project_documents:update:any", label: "Edit Dok. Proyek" },
  { key: "project_documents:download:any", label: "Unduh Dok. Proyek" },
  { key: "project_documents:delete:any", label: "Hapus Dok. Proyek" },

  // INVESTORS
  { key: "investors:create:any", label: "Buat Investor (Semua)" },
  { key: "investors:create:own", label: "Buat Investor (Sendiri)" },
  { key: "investors:read:any", label: "Lihat Investor (Semua)" },
  { key: "investors:read:own", label: "Lihat Profil Sendiri" },
  { key: "investors:update:any", label: "Edit Investor (Semua)" },
  { key: "investors:update:own", label: "Edit Profil Sendiri" },
  { key: "investors:delete:any", label: "Hapus Investor (Semua)" },
  { key: "investors:delete:own", label: "Hapus Profil Sendiri" },

  // INVESTOR DOCUMENTS
  { key: "investor_documents:upload:any", label: "Unggah Dok. Investor (Semua)" },
  { key: "investor_documents:upload:own", label: "Unggah Dokumen Sendiri" },
  { key: "investor_documents:download:any", label: "Unduh Dok. Investor (Semua)" },
  { key: "investor_documents:download:own", label: "Unduh Dokumen Sendiri" },
  { key: "investor_documents:delete:any", label: "Hapus Dok. Investor (Semua)" },
  { key: "investor_documents:delete:own", label: "Hapus Dokumen Sendiri" },

  // USERS & ROLES
  { key: "users:create:any", label: "Buat User Baru" },
  { key: "users:create:own", label: "Buat Akun Sendiri" },
  { key: "users:read:any", label: "Lihat Semua User" },
  { key: "users:read:own", label: "Lihat Akun Sendiri" },
  { key: "users:update:any", label: "Edit Semua User" },
  { key: "users:update:own", label: "Edit Akun Sendiri" },
  { key: "users:delete:any", label: "Hapus Semua User" },
  { key: "users:delete:own", label: "Hapus Akun Sendiri" },
  { key: "roles:read:any", label: "Lihat Role Sistem" },
  { key: "roles:read:own", label: "Lihat Role Sendiri" },
  { key: "roles:update:any", label: "Edit Role Sistem" },
] as const;

export type PermissionKey = string; 

export interface Permission {
  id: string;
  key: string;
  label: string;
}

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
    rolePermissions?: { permission: { permission_key: PermissionKey } }[];
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
    role: (u.role?.role_name || u.role_name || "user") as UserRole,
    status: u.is_active ? "active" : "inactive",
    permissions: u.role?.rolePermissions
      ? u.role.rolePermissions
          .map((rp) => rp.permission?.permission_key)
          .filter(Boolean)
      : (u.permission_ids || []),
    lastLoginAt: u.last_login_at || null,
  };
}

// Helper: role yang tidak bisa dihapus oleh siapapun
export const PROTECTED_ROLES: UserRole[] = ["bod"];

// Helper: role yang bisa mengakses panel admin
export const ADMIN_ROLES: UserRole[] = ["superadmin", "admin", "bod"];