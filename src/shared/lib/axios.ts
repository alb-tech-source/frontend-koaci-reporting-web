import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { clearRoleCookie } from "./roleCookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 401 dari endpoint ini berarti kredensial/token salah, bukan sesi habis —
// jangan dicoba refresh (kalau tidak, login gagal akan me-reload halaman).
const AUTH_ENDPOINTS_WITHOUT_REFRESH =
  /\/auth\/(login|refresh|register|google|forgot-password|reset-password)\b/;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !AUTH_ENDPOINTS_WITHOUT_REFRESH.test(originalRequest.url ?? "")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => { throw err; });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        processQueue(null, "success");
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          useAuthStore.getState().clearAuth();
          // Tanpa ini middleware masih menganggap user login dan memantulkan "/" ke /admin
          clearRoleCookie();
          window.location.href = "/";
        }
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }
    throw error;
  }
);

export function getErrorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? fallback;
  // Error non-axios (mis. kegagalan PUT ke storage saat upload presigned) tetap terbaca
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default api;