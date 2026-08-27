import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // ✅ WAJIB jika ada set cookie dari backend (misal: refresh token)
});

// ✅ TAMBAHKAN INI: Request Interceptor untuk membaca token dari LocalStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor (Kode Anda sudah benar, biarkan seperti ini)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          useAuthStore.getState().clearAuth();
          localStorage.removeItem("access_token"); // ✅ Pastikan token lama dibersihkan
          localStorage.removeItem("refresh_token");
          window.location.href = "/";
        }
        throw refreshError;
      }
    }
    throw error;
  },
);

export function getErrorMessage(
  err: unknown,
  fallback = "Terjadi kesalahan. Coba lagi.",
): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? fallback;
  }
  return fallback;
}

export default api;