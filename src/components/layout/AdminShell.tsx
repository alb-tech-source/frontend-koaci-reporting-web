"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Search,
  Settings,
  Users,
  Wallet,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

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
import { cn } from "@/shared/lib/utils";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const defaultAdminNav: AdminNavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/investor", label: "Investor", icon: Users },
  { to: "/admin/portofolio", label: "Portofolio", icon: Wallet },
  { to: "/admin/laporan", label: "Laporan", icon: FileText },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

interface AdminShellProps {
  children: ReactNode;
  navItems?: AdminNavItem[];
  title?: string;
  user?: { name: string; email?: string };
}

export function AdminShell({
  children,
  navItems = defaultAdminNav,
  title = "Koaci Admin",
  user = { name: "Admin", email: "admin@koaci.id" },
}: AdminShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AdminSidebar navItems={navItems} title={title} />
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
                  <p className="text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  {user.email ? (
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  ) : null}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-brand text-brand-foreground text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
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
}: {
  navItems: AdminNavItem[];
  title: string;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  <Link href="/investors">Investor</Link>;

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
