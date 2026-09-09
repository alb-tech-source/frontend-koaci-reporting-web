"use client";

import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { EmptyStateGeneral, TableSkeleton, DeleteConfirmDialog } from "@/shared/components/ui/feedback";
import { usePaginatedList } from "@/shared/hooks/use-pagination";

import { InvestorFormDialog } from "@/features/investor-management/InvestorFormDialog";
import { DocumentListPanel } from "@/features/investor-management/DocumentListPanel";
import { fetchInvestors, fetchLinkableUsers, createInvestor, updateInvestor, deleteInvestor } from "@/features/investor-management/api";
import type { Investor, InvestorFormValues, InvestorStatus } from "@/features/investor-management/types";
import { statusBadgeVariant, statusLabel } from "@/features/investor-management/utils";
import { formatIDR } from "@/shared/lib/format";
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
  return (
    <ClientGuard requirePermission="investors:read" fallback={<TableSkeleton />}>
      <InvestorListPage />
    </ClientGuard>
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
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investor | null>(null);
  const [viewing, setViewing] = useState<Investor | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((i) => {
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
      const matchStatus = status === "all" || i.status === status;
      return matchQ && matchStatus;
    });
  }, [data, search, status]);

  const { setPage, pageItems, totalPages, currentPage, start } = usePaginatedList(filtered, PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: async ({ input }: { input: InvestorFormValues }) => createInvestor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "investors", "linkable-users"] });
      toast.success("Investor berhasil ditambahkan!");
      setOpen(false);
    },
    onError: () => toast.error("Terjadi kesalahan saat menyimpan data."),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: InvestorFormValues }) => updateInvestor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
      toast.success("Data investor berhasil diperbarui!");
      setOpen(false);
      setEditing(null);
    },
    onError: () => toast.error("Terjadi kesalahan saat memperbarui data."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvestor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investors"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "investors", "linkable-users"] });
      toast.success("Investor berhasil dihapus!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Terjadi kesalahan saat menghapus data investor."),
  });

  const handleSubmit = (input: InvestorFormValues) => {
    if (editing) updateMutation.mutate({ id: editing.id, payload: input });
    else createMutation.mutate({ input });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Daftar Investor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola data investor Koaci Reporting App.</p>
        </div>

        {canCreate && (
          <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Investor
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Cari nama atau email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 pl-9" />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v as InvestorStatus | "all"); setPage(1); }}>
            <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder="Semua Status" /></SelectTrigger>
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
                {hasActions && <TableHead className="w-16 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasActions ? 5 : 4} className="h-64">
                    <EmptyStateGeneral title="Belum ada investor" description="Data investor yang Anda cari tidak ditemukan." icon={Users} />
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell><div className="font-medium text-foreground">{inv.name}</div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.email}</TableCell>
                    <TableCell className="text-right font-medium">{formatIDR(inv.totalInvestasi)}</TableCell>
                    <TableCell><Badge variant={statusBadgeVariant[inv.status]}>{statusLabel[inv.status]}</Badge></TableCell>
                    {hasActions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Aksi investor"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setViewing(inv)}>Lihat detail</DropdownMenuItem>
                            {canUpdate && <DropdownMenuItem onSelect={() => { setEditing(inv); setOpen(true); }}>Edit</DropdownMenuItem>}
                            {canDelete && <DropdownMenuItem className="text-danger focus:text-danger" onSelect={() => setDeleteTarget(inv)}>Hapus</DropdownMenuItem>}
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

        {pageItems.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan <span className="font-medium text-foreground">{start + 1}-{start + pageItems.length}</span> dari <span className="font-medium text-foreground">{filtered.length}</span> investor
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
              <span className="text-xs text-muted-foreground">Hal. {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</Button>
            </div>
          </div>
        )}
      </div>

      <InvestorFormDialog open={open} onOpenChange={(next) => { if (!isPending) { setOpen(next); if (!next) setEditing(null); } }} onSubmit={handleSubmit} users={users} mode={editing ? "edit" : "create"} initialValue={editing} isSubmitting={isPending} />

      {/* ✅ Menggunakan Global Delete Dialog */}
      <DeleteConfirmDialog 
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && !deleteMutation.isPending && setDeleteTarget(null)}
        title="Hapus Investor"
        description={<>Yakin ingin menghapus profil investor <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? Tindakan ini permanen dan akan menghapus semua dokumen yang terkait.</>}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={viewing !== null} onOpenChange={(isOpen) => !isOpen && setViewing(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0">
          <div className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
            <DialogHeader>
              <DialogTitle>Detail Profil Investor</DialogTitle>
              <DialogDescription>Informasi lengkap terkait profil dan data rekening investor.</DialogDescription>
            </DialogHeader>
          </div>
          {viewing && (
            <div className="space-y-6 px-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Nama Lengkap</p><p className="font-medium text-foreground">{viewing.name}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium text-foreground">{viewing.email}</p></div>
                <div><p className="text-muted-foreground">No. Telepon</p><p className="font-medium text-foreground">{viewing.phone || "-"}</p></div>
                <div><p className="text-muted-foreground">NIK</p><p className="font-medium text-foreground">{viewing.nik}</p></div>
                <div><p className="text-muted-foreground">Jenis Kelamin</p><p className="font-medium text-foreground">{viewing.gender === "men" ? "Laki-laki" : "Perempuan"}</p></div>
                <div><p className="text-muted-foreground">Tipe Investor</p><p className="font-medium text-foreground">{viewing.investorType === "individual" ? "Individu" : "Korporasi"}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Alamat</p><p className="font-medium text-foreground">{viewing.address}</p></div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="mb-3 font-semibold text-foreground">Informasi Keuangan</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Nama Bank</p><p className="font-medium text-foreground">{viewing.bankName}</p></div>
                  <div><p className="text-muted-foreground">No. Rekening</p><p className="font-medium text-foreground">{viewing.accountNumber}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Total Investasi Saat Ini</p><p className="font-semibold text-success text-lg">{formatIDR(viewing.totalInvestasi)}</p></div>
                </div>
              </div>
              {viewing.heir?.name && (
                <div className="border-t border-border pt-4">
                  <h4 className="mb-3 font-semibold text-foreground">Data Ahli Waris</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Nama</p><p className="font-medium text-foreground">{viewing.heir.name}</p></div>
                    <div><p className="text-muted-foreground">Hubungan</p><p className="font-medium text-foreground">{viewing.heir.relation}</p></div>
                    <div><p className="text-muted-foreground">No. Telepon</p><p className="font-medium text-foreground">{viewing.heir.phone || "-"}</p></div>
                    <div><p className="text-muted-foreground">NIK</p><p className="font-medium text-foreground">{viewing.heir.nik || "-"}</p></div>
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-4">
                <DocumentListPanel investorId={viewing.id} />
              </div>
            </div>
          )}
          <div className="px-6 py-4 border-t border-border bg-background sticky bottom-0">
            <DialogFooter className="sm:justify-end">
              <Button variant="outline" onClick={() => setViewing(null)}>Tutup</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}