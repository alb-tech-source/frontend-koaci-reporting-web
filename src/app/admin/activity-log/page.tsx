"use client"; 

import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Search } from "lucide-react";
import { Suspense, useState, useEffect } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { fetchActivityLogs } from "@/features/activity-log/api";
import { ACTIVITY_ACTIONS } from "@/features/activity-log/types";
import {
  actionBadgeClass,
  formatDateTime,
  getActionLabel,
  roleBadgeClass,
  roleDisplay,
} from "@/features/activity-log/utils";
import { getCurrentRole } from "@/shared/lib/auth";
import { cn } from "@/shared/lib/utils";

const PAGE_SIZE = 20;

export default function ActivityLogRoute() {
  const role = getCurrentRole();
  if (!["superadmin", "bod"].includes(role ?? "")) {
    return (
        <AccessDenied />
    );
  }

  return (
      <Suspense fallback={<TableSkeleton />}>
        <ActivityLogPage />
      </Suspense>
  );
}

function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data } = useSuspenseQuery({
    queryKey: [
      "admin", 
      "activity-logs", 
      page, 
      debouncedSearch, 
      action, 
      startDate, 
      endDate
    ],
    queryFn: () =>
      fetchActivityLogs({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        action: action !== "all" ? action : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const pageItems = data.data.items;
  const totalItems = data.data.total;
  const totalPages = data.data.totalPages;
  const currentPage = data.data.page;

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Log Aktivitas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantau seluruh aktivitas pengguna sistem.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[minmax(0,1fr)_11rem_auto]">
          
          {/* SEARCH */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Cari nama pengguna..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="h-9 pl-9"
              aria-label="Cari nama pengguna"
            />
          </div>

          {/* FILTER ACTION */}
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              resetPage();
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Semua Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              {ACTIVITY_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {getActionLabel(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* DATE RANGE */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="log-start" className="text-xs text-muted-foreground">Dari</Label>
              <Input
                id="log-start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  resetPage();
                }}
                className="h-9 w-full sm:w-40"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="log-end" className="text-xs text-muted-foreground">Sampai</Label>
              <Input
                id="log-end"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  resetPage();
                }}
                className="h-9 w-full sm:w-40"
              />
            </div>
          </div>
        </div>

        {/* TABLE RENDER */}
        {pageItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Objek</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{log.userName}</div>
                      <div className="text-xs text-muted-foreground">{log.userId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(roleBadgeClass(log.userRole))}>
                        {roleDisplay(log.userRole)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(actionBadgeClass(log.action))}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.resource}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ip}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Total <span className="font-medium text-foreground">{totalItems}</span> log ditemukan
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground">
              Hal. {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Activity className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm text-muted-foreground">Belum ada log aktivitas.</p>
    </div>
  );
}

function AccessDenied() { 
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-card">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-danger/10">
        <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">Akses Ditolak</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Halaman Log Aktivitas hanya dapat diakses oleh Super Admin dan BOD.
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}