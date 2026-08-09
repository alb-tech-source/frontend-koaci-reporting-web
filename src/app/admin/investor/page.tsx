"use client";

import {
  queryOptions,
  useSuspenseQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
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
import {
  fetchInvestors,
  fetchLinkableUsers,
  createInvestor,
  updateInvestor,
  uploadInvestorDocument,
} from "@/features/investor-management/api";
import type {
  Investor,
  InvestorFormValues,
  InvestorStatus,
} from "@/features/investor-management/types";
import {
  formatIDR,
  statusBadgeVariant,
  statusLabel,
} from "@/features/investor-management/utils";
import { hasPermission } from "@/shared/lib/auth";

const investorsQuery = queryOptions({
  queryKey: ["admin", "investors"],
  queryFn: () => fetchInvestors(),
});

const linkableUsersQuery = queryOptions({
  queryKey: ["admin", "investors", "linkable-users"],
  queryFn: fetchLinkableUsers,
});

const PAGE_SIZE = 4;

export default function InvestorPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <TableSkeleton />;
  }

  // Security Guard: Blokir akses halaman jika tidak punya izin "investors:read"
  if (!hasPermission("investors:read")) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Akses Ditolak</h2>
        <p className="text-sm text-muted-foreground">
          Anda tidak memiliki izin (investors:read) untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<TableSkeleton />}>
      <InvestorListPage />
    </Suspense>
  );
}

function InvestorListPage() {
  const { data } = useSuspenseQuery(investorsQuery);
  const { data: users } = useSuspenseQuery(linkableUsersQuery);
  const queryClient = useQueryClient();

  // Element-Level Authorization: Kontrol aksi berdasarkan izin
  const canCreate = hasPermission("investors:create");
  const canUpdate = hasPermission("investors:update");
  const canDelete = hasPermission("investors:delete");
  const hasActions = canUpdate || canDelete;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvestorStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);

  // MUTASI CREATE DENGAN CHAINED FILE UPLOAD
  const createMutation = useMutation({
    mutationFn: async ({
      input,
      file,
    }: {
      input: InvestorFormValues;
      file?: File | null;
    }) => {
      // 1. Tembak API Create Investor
      const response = await createInvestor(input);
      const newInvestorId =
        response?.data?.investor_id || response?.investor_id;

      // 2. Jika sukses dan ada file yang dipilih, otomatis tembak API Upload Document
      if (file && newInvestorId) {
        await uploadInvestorDocument(
          newInvestorId,
          input.documentName || file.name,
          file,
        );
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("Gagal menyimpan investor:", error);
      alert("Terjadi kesalahan saat menyimpan data. Coba lagi.");
    },
  });

  // MUTASI UPDATE DENGAN FILE UPLOAD
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
      file,
    }: {
      id: string;
      payload: InvestorFormValues;
      file?: File | null;
    }) => {
      // 1. Update data teks
      const response = await updateInvestor(id, payload);

      // 2. Jika edit juga menyisipkan file baru, upload file-nya
      if (file) {
        await uploadInvestorDocument(
          id,
          payload.documentName || file.name,
          file,
        );
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (error) => {
      console.error("Gagal mengupdate investor:", error);
      alert("Terjadi kesalahan saat memperbarui data. Coba lagi.");
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((i) => {
      const matchQ =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q);
      const matchStatus = status === "all" || i.status === status;
      return matchQ && matchStatus;
    });
  }, [data, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Tangkap file dari komponen Dialog Form
  const handleSubmit = (input: InvestorFormValues, file?: File | null) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: input, file });
    } else {
      createMutation.mutate({ input, file });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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

        {/* Render kondisional berdasarkan izin */}
        {canCreate && (
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
            Tambah Investor
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as InvestorStatus | "all");
              setPage(1);
            }}
          >
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
                {hasActions && (
                  <TableHead className="w-16 text-right">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={hasActions ? 5 : 4}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada investor yang cocok.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {inv.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inv.id}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.email}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatIDR(inv.totalInvestasi)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[inv.status]}>
                        {statusLabel[inv.status]}
                      </Badge>
                    </TableCell>

                    {hasActions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Aksi investor"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Lihat detail</DropdownMenuItem>

                            {canUpdate && (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditing(inv);
                                  setOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                            )}

                            {canDelete && (
                              <DropdownMenuItem className="text-danger focus:text-danger">
                                Hapus
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Menampilkan{" "}
            <span className="font-medium text-foreground">
              {pageItems.length}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            investor
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
              Hal. {currentPage} / {totalPages}
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

      <InvestorFormDialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) {
            setOpen(next);
            if (!next) setEditing(null);
          }
        }}
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
