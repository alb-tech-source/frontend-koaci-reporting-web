"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { hasPermission, getCurrentRole } from "@/shared/lib/auth";

export function ClientGuard({ 
  children, 
  requiredPermission,
  requiredRole 
}: Readonly<{ 
  children: React.ReactNode; 
  requiredPermission?: string;
  requiredRole?: string;
}>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isRoleValid = requiredRole ? getCurrentRole() === requiredRole : true;
  const isPermValid = requiredPermission ? hasPermission(requiredPermission) : true;

  if (!isRoleValid || !isPermValid) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Akses Ditolak</h2>
        <p className="text-sm text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  return <>{children}</>;
}