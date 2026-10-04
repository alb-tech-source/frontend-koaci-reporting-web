"use client"; // Error boundary wajib Client Component

import { useEffect } from "react";

import "./globals.css";

// Menggantikan root layout saat error terjadi di luar segmen /admin,
// jadi harus membawa <html> dan <body> sendiri.
export default function GlobalError({
  error,
  unstable_retry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <title>Terjadi Kesalahan · Koaci Reporting App</title>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-center">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Terjadi Kesalahan
            </h1>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Aplikasi mengalami kendala yang tidak terduga. Silakan coba lagi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground"
          >
            Coba Lagi
          </button>
        </main>
      </body>
    </html>
  );
}
