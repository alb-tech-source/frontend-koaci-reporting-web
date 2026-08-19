import api from "./axios";
import { useAuthStore } from "../store/authStore";

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  return useAuthStore.getState().user;
}

export function getCurrentRole(): string | null {
  return getCurrentUser()?.role ?? null;
}

export function isInvestor(): boolean {
  return getCurrentRole() === "investor";
}

export function isUser(): boolean {
  return getCurrentRole() === "user";
}

export function hasPermission(permissionKey: string): boolean {
  const user = getCurrentUser();
  if (user?.role === "superadmin") return true;
  return user?.permissions?.includes(permissionKey) ?? false;
}

export async function logout(redirectTo: string = "/") {
  if (typeof window === "undefined") return;

  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Gagal memanggil API logout di server", error);
  } finally {
    useAuthStore.getState().clearAuth();
    window.location.href = redirectTo;
  }
}