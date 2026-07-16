import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Akses Ditolak</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Akun Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi
          administrator jika Anda merasa ini kesalahan.
        </p>
      </div>
      <Button asChild variant="primary">
        <Link href="/">Kembali ke Halaman Masuk</Link>
      </Button>
    </div>
  );
}