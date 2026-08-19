import api from "@/shared/lib/axios";

export async function login(payload: any) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, newPassword: string) {
  const { data } = await api.post("/auth/reset-password", { token, newPassword });
  return data;
}

export async function registerWithEmail(payload: {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginWithGoogle(credential: string) {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}

export async function sendVerifyEmail(email: string) {
  const { data } = await api.post("/auth/send-verify-email", { email });
  return data;
}

export async function verifyEmailToken(token: string) {
  const { data } = await api.get("/auth/verify-email", { params: { token } });
  return data;
}