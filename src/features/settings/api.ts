import api from "@/shared/lib/axios";

export async function fetchAllPermissions() {
  const { data } = await api.get("/permissions");
  return data.data as { permission_id: string; permission_key: string }[];
}

// --- AKUN SENDIRI (halaman Pengaturan) ---

export interface UpdateProfilePayload {
  firstname?: string;
  lastname?: string;
  email?: string;
}

/** Update profil sendiri lewat PUT /users/:id (izin users:update:own atau :any). */
export async function updateMyProfile(
  userId: string,
  payload: UpdateProfilePayload,
): Promise<{ requiresEmailVerification: boolean }> {
  const { data } = await api.put(`/users/${userId}`, payload);
  return {
    requiresEmailVerification: Boolean(data?.data?.requiresEmailVerification),
  };
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const { data } = await api.post("/auth/change-password", payload);
  return data;
}

/** Kirim link verifikasi ke email user yang sedang login (tanpa body). */
export async function sendMyVerifyEmail(): Promise<string> {
  const { data } = await api.post("/auth/send-verify-email");
  return data?.message ?? "Email verifikasi telah dikirim.";
}
