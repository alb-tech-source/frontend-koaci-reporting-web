import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Halaman yang Anda tuju tidak tersedia atau sudah dipindahkan.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground"
      >
        Kembali ke Beranda
      </Link>
    </main>
  );
}
