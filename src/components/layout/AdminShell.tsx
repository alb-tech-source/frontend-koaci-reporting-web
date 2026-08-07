// web/src/components/layout/AdminShell.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Search,
  Users,
  Activity,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { cn } from "@/shared/lib/utils";
import { hasPermission, logout, getCurrentUser, fetchCurrentUserProfile } from "@/shared/lib/auth";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const defaultAdminNav: AdminNavItem[] = [
  { to: "/admin/dashboard",      label: "Dashboard",    icon: LayoutDashboard },
  { to: "/admin/investor",       label: "Investor",     icon: Users },
  { to: "/admin/users",          label: "Users",        icon: Users },
  { to: "/admin/activity-log",   label: "Log Aktivitas", icon: Activity },
];

interface AdminShellProps {
  children: ReactNode;
  navItems?: AdminNavItem[];
  title?: string;
  user?: { name?: string; email?: string }; 
}

export function AdminShell({
  children,
  navItems = defaultAdminNav,
  title = "Koaci Admin",
  user,
}: Readonly<AdminShellProps>) {
  const canViewUsers = hasPermission("users:read");
  const currentUser = getCurrentUser();

  const { data: profile } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: fetchCurrentUserProfile,
    staleTime: Infinity,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filteredNavItems = navItems.filter(
    (item) => item.to !== "/admin/users" || canViewUsers
  );

  const displayName = profile?.firstname ?? "Pengguna";
  const displayEmail = profile?.email ?? currentUser?.email ?? user?.email ?? "admin@koaci.id";
  const initials = displayName.slice(0, 2).toUpperCase();
  
  if (!mounted) {
    return <div className="min-h-screen w-full bg-muted/40" />; 
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        {/* Kirimkan nav items yang sudah di-filter */}
        <AdminSidebar navItems={filteredNavItems} title={title} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-6">
            <SidebarTrigger className="shrink-0" />
            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Cari investor, portofolio, laporan…"
                className="h-9 pl-9"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifikasi">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="text-right leading-tight">
                  {/* === IMPLEMENTASI RENDER NAMA & EMAIL === */}
                  <p className="text-sm font-medium text-foreground">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {displayEmail}
                  </p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-brand text-brand-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Implementasi AlertDialog untuk Logout */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Keluar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anda perlu login kembali untuk mengakses Reporting Console.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                      className="bg-danger text-white hover:bg-danger/90"
                      onClick={() => logout("/")}>
                        Ya, Keluar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar({
  navItems,
  title,
}: Readonly<{
  navItems: AdminNavItem[];
  title: string;
}>) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand text-brand-foreground font-bold">
            K
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Reporting Console
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.to}
                        className={cn(
                          "flex items-center gap-2",
                          active && "text-brand font-medium",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}