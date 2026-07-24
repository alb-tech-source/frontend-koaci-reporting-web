import { jwtDecode } from "jwt-decode";

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