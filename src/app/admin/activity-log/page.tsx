"use client"; 

import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Search } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { EmptyStateGeneral, TableSkeleton } from "@/shared/components/ui/feedback";

import { fetchActivityLogs } from "@/features/activity-log/api";
import { ACTIVITY_ACTIONS } from "@/features/activity-log/types";
import { actionBadgeClass, formatDateTime, getActionLabel, roleBadgeClass, roleDisplay } from "@/features/activity-log/utils";

const PAGE_SIZE = 20;

export default function ActivityLogRoute() {
  return (
    <ClientGuard requireRole="bod" fallback={<TableSkeleton />}>
      <ActivityLogPage />
    </ClientGuard>
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
    queryKey: ["admin", "activity-logs", page, debouncedSearch, action, startDate, endDate],
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

  const pageItems = data?.data?.items ?? [];
  const totalItems = data?.data?.total ?? 0;
  const totalPages = data?.data?.totalPages ?? 1;
  const currentPage = data?.data?.page ?? 1;

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Log Aktivitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pantau seluruh aktivitas pengguna sistem.</p>
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[minmax(0,1fr)_11rem_auto]">
          {/* SEARCH */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" placeholder="Cari nama pengguna..." value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="h-9 pl-9" aria-label="Cari nama pengguna" />
          </div>

          {/* FILTER ACTION */}
          <Select value={action} onValueChange={(v) => { setAction(v); resetPage(); }}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Semua Aksi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              {ACTIVITY_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{getActionLabel(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* DATE RANGE */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="log-start" className="text-xs text-muted-foreground">Dari</Label>
              <Input id="log-start" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); resetPage(); }} className="h-9 w-full sm:w-40" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="log-end" className="text-xs text-muted-foreground">Sampai</Label>
              <Input id="log-end" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); resetPage(); }} className="h-9 w-full sm:w-40" />
            </div>
          </div>
        </div>

        {/* TABLE RENDER */}
        {pageItems.length === 0 ? (
          <EmptyStateGeneral 
            title="Belum ada log aktivitas" 
            description="Sistem belum mencatat aktivitas apa pun dengan filter saat ini." 
            icon={Activity} 
          />
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
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell><div className="font-medium text-foreground">{log.userName}</div></TableCell>
                    <TableCell><Badge variant="outline" className={cn(roleBadgeClass(log.userRole))}>{roleDisplay(log.userRole)}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={cn(actionBadgeClass(log.action))}>{getActionLabel(log.action)}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.resource}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
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
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
            <span className="text-xs text-muted-foreground">Hal. {currentPage} / {totalPages || 1}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</Button>
          </div>
        </div>
      </div>
    </div>
  );
}