"use client";

import {
  queryOptions,
  useSuspenseQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  AlertTriangle,
  Loader2 
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner"; // Import toast untuk notifikasi sukses/gagal

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import { InvestorFormDialog } from "@/features/investor-management/InvestorFormDialog";
import {
  fetchInvestors,
  fetchLinkableUsers,
  createInvestor,
  updateInvestor,
  uploadInvestorDocument,
  deleteInvestor, 
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

const PAGE_SIZE = 10;

export default function InvestorPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <TableSkeleton />;
  }

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

  const canCreate = hasPermission("investors:create");
  const canUpdate = hasPermission("investors:update");
  const canDelete = hasPermission("investors:delete");
  const hasActions = canUpdate || canDelete;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvestorStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investor | null>(null);
  const [viewing, setViewing] = useState<Investor | null>(null);

  // --- MUTASI CREATE ---
  const createMutation = useMutation({
    mutationFn: async ({
      input,
      file,
    }: {
      input: InvestorFormValues;
      file?: File | null;
    }) => {
      const response = await createInvestor(input);
      const newInvestorId = response?.data?.investor_id || response?.investor_id;

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
      queryClient.invalidateQueries({ queryKey: ["admin", "investors", "linkable-users"] });
      toast.success("Investor berhasil ditambahkan!");
      setOpen(false);
    },
    onError: (error) => {
      console.error("Gagal menyimpan investor:", error);
      toast.error("Terjadi kesalahan saat menyimpan data.");
    },
  });

  // --- MUTASI UPDATE ---
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
      const response = await updateInvestor(id, payload);
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
      toast.success("Data investor berhasil diperbarui!");
      setOpen(false);
      setEditing(null);
    },
    onError: (error) => {
      console.error("Gagal mengupdate investor:", error);
      toast.error("Terjadi kesalahan saat memperbarui data.");
    },
  });

  // --- MUTASI DELETE ---
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvestor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "investors", "linkable-users"] });
      toast.success("Investor berhasil dihapus!");
      setDeleteTarget(null); // Tutup modal
    },
    onError: (error) => {
      console.error("Gagal menghapus investor:", error);
      toast.error("Terjadi kesalahan saat menghapus data investor.");
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

        {canCreate && (
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            disabled={isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
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
              <SelectItem value="inactive">Non-aktif</SelectItem>
              <SelectItem value="blacklist">Blacklist</SelectItem>
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
                            <DropdownMenuItem onSelect={() => setViewing(inv)}>
                              Lihat detail
                            </DropdownMenuItem>

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
                              <DropdownMenuItem 
                                className="text-danger focus:text-danger"
                                onSelect={() => setDeleteTarget(inv)}
                              >
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
        isSubmitting={isPending} 
      />

      {/* MODAL KONFIRMASI HAPUS */}
      <Dialog open={deleteTarget !== null} onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <DialogTitle>Hapus Investor</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus profil investor <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? 
              Tindakan ini permanen dan akan menghapus semua dokumen yang terkait.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button 
              variant="danger" 
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DETAIL INVESTOR */}
      <Dialog open={viewing !== null} onOpenChange={(isOpen) => !isOpen && setViewing(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Profil Investor</DialogTitle>
            <DialogDescription>
              Informasi lengkap terkait profil dan data rekening investor.
            </DialogDescription>
          </DialogHeader>
          
          {viewing && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium text-foreground">{viewing.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{viewing.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">No. Telepon</p>
                  <p className="font-medium text-foreground">{viewing.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NIK</p>
                  <p className="font-medium text-foreground">{viewing.nik}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jenis Kelamin</p>
                  <p className="font-medium text-foreground">{viewing.gender === "men" ? "Laki-laki" : "Perempuan"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipe Investor</p>
                  <p className="font-medium text-foreground">{viewing.investorType === "individual" ? "Individu" : "Korporasi"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Alamat</p>
                  <p className="font-medium text-foreground">{viewing.address}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="mb-3 font-semibold text-foreground">Informasi Keuangan</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nama Bank</p>
                    <p className="font-medium text-foreground">{viewing.bankName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">No. Rekening</p>
                    <p className="font-medium text-foreground">{viewing.accountNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Total Investasi Saat Ini</p>
                    <p className="font-semibold text-success text-lg">{formatIDR(viewing.totalInvestasi)}</p>
                  </div>
                </div>
              </div>

              {/* Tampilkan seksi ini hanya jika Ahli Waris diisi */}
              {viewing.heir && viewing.heir.name && (
                <div className="border-t border-border pt-4">
                  <h4 className="mb-3 font-semibold text-foreground">Data Ahli Waris</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nama</p>
                      <p className="font-medium text-foreground">{viewing.heir.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hubungan</p>
                      <p className="font-medium text-foreground">{viewing.heir.relation}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">No. Telepon</p>
                      <p className="font-medium text-foreground">{viewing.heir.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">NIK</p>
                      <p className="font-medium text-foreground">{viewing.heir.nik || "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setViewing(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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