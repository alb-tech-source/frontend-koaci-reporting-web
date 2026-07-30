import { jwtDecode } from "jwt-decode";
import api from "./axios";

interface JwtPayload {
  role: string;
  permissions: string[];
  [key: string]: unknown;
}

export function getCurrentUser(): JwtPayload | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export async function fetchCurrentUserProfile() {
  const user = getCurrentUser(); 
  if (!user) return null;
  const { data } = await api.get(`/users/${user.userId}`);
  return data.data; 
}

export function hasPermission(permissionKey: string): boolean {
  const user = getCurrentUser();
  return user?.permissions?.includes(permissionKey) ?? false;
}

export function logout(redirectTo: string = "/") {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0"; // hapus cookie
  window.location.href = redirectTo;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, newPassword: string) {
  const { data } = await api.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return data;
}