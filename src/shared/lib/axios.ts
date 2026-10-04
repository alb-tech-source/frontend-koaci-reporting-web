import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import { clearRoleCookie, setRoleCookie } from "./roleCookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// 401 dari endpoint ini berarti kredensial/token salah, bukan sesi habis —
// jangan dicoba refresh (kalau tidak, login gagal akan me-reload halaman).
const AUTH_ENDPOINTS_WITHOUT_REFRESH =
  /\/auth\/(login|refresh|register|google|forgot-password|reset-password)\b/;

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Satu refresh dipakai bersama oleh semua request yang gagal 401 bersamaan
let refreshPromise: Promise<void> | null = null;
let sessionEnded = false;

function refreshSession(): Promise<void> {
  refreshPromise ??= api
    .post("/auth/refresh")
    .then(() => {
      // Refresh token dirotasi (7 hari lagi), jadi shadow cookie ikut diperpanjang
      const role = useAuthStore.getState().user?.role.role_name;
      if (role) setRoleCookie(role);
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

/** Refresh ditolak server (token kedaluwarsa/tidak valid, user nonaktif). */
function isSessionRejected(error: unknown): boolean {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return status === 401 || status === 403;
}

function endSession() {
  if (typeof window === "undefined" || sessionEnded) return;
  sessionEnded = true;
  useAuthStore.getState().clearAuth();
  // Tanpa ini middleware masih menganggap user login dan memantulkan "/" ke /admin
  clearRoleCookie();
  window.location.href = "/";
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      AUTH_ENDPOINTS_WITHOUT_REFRESH.test(originalRequest.url ?? "")
    ) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      await refreshSession();
    } catch (refreshError) {
      // Gangguan jaringan, timeout atau 5xx saat refresh bukan berarti sesi habis —
      // biarkan request ini gagal tanpa me-logout user.
      if (isSessionRejected(refreshError)) endSession();
      throw refreshError;
    }

    return api(originalRequest);
  },
);

export function getErrorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? fallback;
  // Error non-axios (mis. kegagalan PUT ke storage saat upload presigned) tetap terbaca
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default api;
