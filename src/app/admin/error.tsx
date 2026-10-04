"use client"; // Error boundary wajib Client Component

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import axios from "axios";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/shared/components/ui/button";
import { getErrorMessage } from "@/shared/lib/axios";

const FALLBACK_MESSAGE =
  "Terjadi kesalahan saat memuat halaman. Silakan coba lagi.";

export default function AdminError({
  error,
  unstable_retry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  const { reset } = useQueryErrorResetBoundary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Pesan dari API aman ditampilkan; error render lain cukup pesan umum
  const message = axios.isAxiosError(error)
    ? getErrorMessage(error, FALLBACK_MESSAGE)
    : FALLBACK_MESSAGE;

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Gagal Memuat Halaman
      </h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button
        variant="primary"
        className="mt-4"
        onClick={() => {
          // Izinkan query yang gagal di-fetch ulang sebelum segmen dirender lagi
          reset();
          unstable_retry();
        }}
      >
        Coba Lagi
      </Button>
    </div>
  );
}
