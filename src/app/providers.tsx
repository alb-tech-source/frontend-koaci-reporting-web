"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

import { Toaster } from "@/shared/components/ui/sonner";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // Error 4xx (akses ditolak, tidak ditemukan) tidak akan pulih dengan retry;
        // selain itu cukup sekali agar pesan error tidak tertahan lama.
        retry: (failureCount, error) => {
          const status = axios.isAxiosError(error)
            ? error.response?.status
            : undefined;
          if (status !== undefined && status >= 400 && status < 500) return false;
          return failureCount < 1;
        },
      },
    },
  });
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
