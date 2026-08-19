import axios from "axios";
import { useAuthStore } from "../store/authStore"; // Sesuaikan path ini dengan lokasi file Zustand Anda

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // ✅ WAJIB untuk HttpOnly Cookie
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika 401 Unauthorized dan belum di-retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Panggil endpoint refresh. Browser akan otomatis mengirim cookie refresh_token
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        // Jika sukses, backend akan set cookie access_token baru.
        return api(originalRequest);
      } catch (refreshError) {
        // Jika refresh token gagal/expired, bersihkan Zustand dan logout
        if (typeof window !== "undefined") {
          useAuthStore.getState().clearAuth(); // ✅ Bersihkan state Zustand & localStorage
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
