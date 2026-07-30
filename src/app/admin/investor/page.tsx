"use client";

import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Search, AlertTriangle } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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

import { InvestorFormDialog } from "@/features/investor-management/InvestorFormDialog";
import { fetchInvestors, fetchLinkableUsers } from "@/features/investor-management/api";
import type { Investor, InvestorFormValues, InvestorStatus } from "@/features/investor-management/types";
import { formatIDR, statusBadgeVariant, statusLabel } from "@/features/investor-management/utils";
import { hasPermission } from "@/shared/lib/auth";

const investorsQuery = queryOptions({
  queryKey: ["admin", "investors"],
  queryFn: fetchInvestors,
});

const linkableUsersQuery = queryOptions({
  queryKey: ["admin", "investors", "linkable-users"],
  queryFn: fetchLinkableUsers,
});

const PAGE_SIZE = 4;

// 1. TAMBAHKAN WRAPPER UTAMA & SECURITY GUARD
export default function InvestorPage() {
  const [mounted, setMounted] = useState(false);
    
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <TableSkeleton />;
  }

  // if (!hasPermission("investors:read")) {
  //  return (
  //    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
  //      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
  //        <AlertTriangle className="h-6 w-6" />
  //      </div>
  //     <h2 className="text-lg font-semibold text-foreground">Akses Ditolak</h2>
  //     <p className="text-sm text-muted-foreground">
  //       Anda tidak memiliki izin (investors:read) untuk mengakses halaman ini.
  //     </p>
  //   </div>
  // );
  // }

  return (
    <Suspense fallback={<TableSkeleton />}>
      <InvestorListPage />
    </Suspense>
  );
}

// 2. KOMPONEN HALAMAN LIST
function InvestorListPage() {
  const { data } = useSuspenseQuery(investorsQuery);
  const { data: users } = useSuspenseQuery(linkableUsersQuery);
  const queryClient = useQueryClient();

  // ELEMENT LEVEL AUTHORIZATION
  // const canCreate = hasPermission("investors:create");
  // const canUpdate = hasPermission("investors:update");
  // const canDelete = hasPermission("investors:delete");
  // const hasActions = canUpdate || canDelete;

  const [investors, setInvestors] = useState<Investor[]>(data);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvestorStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return investors.filter((i) => {
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
      const matchStatus = status === "all" || i.status === status;
      return matchQ && matchStatus;
    });
  }, [investors, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = (input: InvestorFormValues) => {
    // Karena masih MOCK, kita update state lokal.
    // Nanti setelah API siap, panggil fungsi POST/PUT dan gunakan queryClient.invalidateQueries
    if (editing) {
      setInvestors((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...input } : i)));
      setEditing(null);
      return;
    }
    const next: Investor = {
      ...input,
      id: `INV-${String(investors.length + 1).padStart(3, "0")}`,
      totalInvestasi: 0,
      status: "pending",
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setInvestors((prev) => [next, ...prev]);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Daftar Investor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data investor Koaci Reporting App.
          </p>
        </div> 
        
          <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            Tambah Investor
          </Button>
    
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as InvestorStatus | "all"); setPage(1); }}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="inactive">Non-aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Total Investasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-sm text-muted-foreground">
                    Tidak ada investor yang cocok.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{inv.name}</div>
                      <div className="text-xs text-muted-foreground">{inv.id}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.email}</TableCell>
                    <TableCell className="text-right font-medium">{formatIDR(inv.totalInvestasi)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[inv.status]}>
                        {statusLabel[inv.status]}
                      </Badge>
                    </TableCell>
                    
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Aksi investor">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Lihat detail</DropdownMenuItem>

                              <DropdownMenuItem onSelect={() => { setEditing(inv); setOpen(true); }}>
                                Edit
                              </DropdownMenuItem>


                              <DropdownMenuItem className="text-danger focus:text-danger">
                                Hapus
                              </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{pageItems.length}</span> dari <span className="font-medium text-foreground">{filtered.length}</span> investor
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Sebelumnya
            </Button>
            <span className="text-xs text-muted-foreground">Hal. {currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Berikutnya
            </Button>
          </div>
        </div>
      </div>

      <InvestorFormDialog
        open={open}
        onOpenChange={(next) => { setOpen(next); if (!next) setEditing(null); }}
        onSubmit={handleSubmit}
        users={users}
        mode={editing ? "edit" : "create"}
        initialValue={editing}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}