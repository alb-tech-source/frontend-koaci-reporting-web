"use client";

import type { ReactNode } from "react";
import { hasPermission, getCurrentRole } from "@/shared/lib/auth";
import { AccessDenied, PageSkeleton } from "@/shared/components/ui/feedback";
import { useHydrated } from "@/shared/hooks/use-hydrated";

interface ClientGuardProps {
  children: ReactNode;
  requirePermission?: string;
  requireRole?: string | string[];
  fallback?: ReactNode;
}

export function ClientGuard({
  children,
  requirePermission,
  requireRole,
  fallback,
}: Readonly<ClientGuardProps>) {
  const mounted = useHydrated();

  if (!mounted) return <>{fallback || <PageSkeleton />}</>;

  const role = getCurrentRole();
  let allowed = true;

  if (requireRole) {
    if (Array.isArray(requireRole)) {
      allowed = requireRole.includes(role || "");
    } else {
      allowed = role === requireRole;
    }
  }

  // Cek Permission jika Role lolos
  if (allowed && requirePermission) {
    allowed = hasPermission(requirePermission);
  }

  if (!allowed) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
