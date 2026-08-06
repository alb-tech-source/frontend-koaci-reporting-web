// src/app/(admin)/layout.tsx
import { AdminShell } from "@/shared/components/layout/AdminShell";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
