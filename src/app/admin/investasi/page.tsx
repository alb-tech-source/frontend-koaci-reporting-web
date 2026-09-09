"use client";

import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { EmptyStateGeneral, PageSkeleton, DeleteConfirmDialog } from "@/shared/components/ui/feedback";
import { usePaginatedList } from "@/shared/hooks/use-pagination";

import { InvestmentDetailSheet } from "@/features/investment-management/InvestmentDetailSheet";
import { InvestmentFormDialog } from "@/features/investment-management/InvestmentFormDialog";
import { createInvestment, deleteInvestment, deleteReceiptDocument, fetchInvestments, fetchInvestorOptions, fetchProjectOptions, getReceiptDownloadUrl, updateInvestment, uploadReceiptDocument } from "@/features/investment-management/api";
import type { InvestmentFormValues, ProjectInvestment } from "@/features/investment-management/types";
import { investorFullName, paymentMethodLabel } from "@/features/investment-management/utils";
import { formatDateID, formatIDR } from "@/shared/lib/format";
import { hasPermission } from "@/shared/lib/auth";

const investmentsQuery = queryOptions({
  queryKey: ["admin", "investments"],
  queryFn: () => fetchInvestments(),
});
const projectOptionsQuery = queryOptions({
  queryKey: ["admin", "investments", "project-options"],
  queryFn: fetchProjectOptions,
});
const investorOptionsQuery = queryOptions({
  queryKey: ["admin", "investments", "investor-options"],
  queryFn: fetchInvestorOptions,
});

export default function AdminInvestasiRoute() {
  return (
    <ClientGuard requirePermission="project_investments:read:any" fallback={<PageSkeleton />}>
      <InvestmentListPage />
    </ClientGuard>
  );
}

const PAGE_SIZE = 10;

function InvestmentListPage() {
  const queryClient = useQueryClient();
  
  const { data: items } = useSuspenseQuery(investmentsQuery);
  const { data: projectOptions } = useSuspenseQuery(projectOptionsQuery);
  const { data: investorOptions } = useSuspenseQuery(investorOptionsQuery);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ProjectInvestment | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectInvestment | null>(null);

  const canCreate = hasPermission("project_investments:create:any");
  const canUpdate = hasPermission("project_investments:update:any");
  const canDelete = hasPermission("project_investments:delete:any");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchQ = !q || investorFullName(i).toLowerCase().includes(q) || i.project.projectKey.toLowerCase().includes(q);
      const matchProject = projectFilter === "all" || i.projectId === projectFilter;
      return matchQ && matchProject;
    });
  }, [items, search, projectFilter]);

  const { setPage, pageItems, totalPages, currentPage, start } = usePaginatedList(filtered, PAGE_SIZE);

  const detail = items.find((i) => i.projectInvestmentId === detailId) ?? null;

  const createMutation = useMutation({
    mutationFn: (values: InvestmentFormValues) => createInvestment(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
      toast.success("Investasi berhasil ditambahkan.");
      setFormOpen(false);
      setPage(1);
    },
    onError: () => toast.error("Gagal menambahkan investasi."),
  });

  const updateMutation = useMutation({
    mutationFn: (values: InvestmentFormValues) => updateInvestment(editing!.projectInvestmentId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
      toast.success("Perubahan investasi tersimpan.");
      setFormOpen(false);
    },
    onError: () => toast.error("Gagal menyimpan perubahan."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
      toast.success("Investasi dihapus.");
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      if (error.message.toLowerCase().includes("receipt")) {
        toast.error("Hapus kwitansi dulu sebelum menghapus investasi ini.");
      } else {
        toast.error("Gagal menghapus investasi.");
      }
    },
  });

  const handleSubmit = (values: InvestmentFormValues) => {
    if (formMode === "edit" && editing) updateMutation.mutate(values);
    else createMutation.mutate(values);
  };

  const handleUploadReceipt = async (file: File, receiptName: string) => {
    if (!detail) return;
    await uploadReceiptDocument(detail.projectInvestmentId, file, receiptName);
    queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    await deleteReceiptDocument(receiptId);
    queryClient.invalidateQueries({ queryKey: ["admin", "investments"] });
  };

  const handleDownloadReceipt = async (receiptId: string) => {
    const url = await getReceiptDownloadUrl(receiptId);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast.error("Tautan unduhan tidak tersedia.");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Manajemen Investasi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola transaksi investasi investor pada setiap proyek.</p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => { setFormMode("create"); setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Investasi
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Cari nama investor atau kode proyek…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 pl-9" />
          </div>
          <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-full sm:w-64"><SelectValue placeholder="Semua Proyek" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Proyek</SelectItem>
              {projectOptions.map((p) => (
                <SelectItem key={p.projectId} value={p.projectId}>{p.projectKey}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Proyek</TableHead>
                <TableHead>Investor</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Metode Bayar</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kwitansi</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64">
                    <EmptyStateGeneral 
                      title="Belum ada investasi" 
                      description="Catat transaksi investasi pertama untuk mulai memantau pendanaan." 
                      icon={Wallet} 
                      action={canCreate ? <Button variant="primary" size="sm" onClick={() => { setFormMode("create"); setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah Investasi</Button> : undefined} 
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((i) => (
                  <TableRow key={i.projectInvestmentId}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-foreground">{i.project.projectKey}</div>
                      <div className="text-xs text-muted-foreground">{i.project.company?.companyName ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{investorFullName(i)}</div>
                      <div className="text-xs text-muted-foreground">{i.investor.user.email || i.investor.nik}</div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{formatIDR(i.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.totalPackage}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{paymentMethodLabel[i.paymentMethod] ?? i.paymentMethod}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateID(i.createdAt)}</TableCell>
                    <TableCell>
                      {i.receiptDocument ? (
                        <Badge className="border-transparent bg-success/15 text-success">Ada</Badge>
                      ) : (
                        <Badge className="border-transparent bg-muted text-muted-foreground">Belum</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi investasi ${i.project.projectKey}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailId(i.projectInvestmentId)}><Eye className="mr-2 h-4 w-4" /> Lihat Detail</DropdownMenuItem>
                          {canUpdate && <DropdownMenuItem onClick={() => { setFormMode("edit"); setEditing(i); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                          {canDelete && <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => setDeleteTarget(i)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pageItems.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Menampilkan <span className="font-medium text-foreground">{start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)}</span> dari <span className="font-medium text-foreground">{filtered.length}</span> investasi</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
              <span className="text-xs text-muted-foreground">Hal. {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</Button>
            </div>
          </div>
        )}
      </div>

      <InvestmentFormDialog open={formOpen} onOpenChange={setFormOpen} mode={formMode} initialValue={editing} onSubmit={handleSubmit} isSubmitting={createMutation.isPending || updateMutation.isPending} projectOptions={projectOptions} investorOptions={investorOptions} />

      <InvestmentDetailSheet investment={detail} open={detail !== null} onOpenChange={(o) => !o && setDetailId(null)} onUploadReceipt={handleUploadReceipt} onDeleteReceipt={handleDeleteReceipt} onDownloadReceipt={handleDownloadReceipt} canManageReceipt={canUpdate} />

      <DeleteConfirmDialog 
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && !deleteMutation.isPending && setDeleteTarget(null)}
        title="Hapus Investasi"
        description={
          <>Yakin menghapus investasi <span className="font-medium text-foreground">{deleteTarget && investorFullName(deleteTarget)}</span> pada proyek <span className="font-medium text-foreground">{deleteTarget?.project.projectKey}</span>? Hapus kwitansi terlebih dahulu jika ada. Tindakan ini permanen.</>
        }
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.projectInvestmentId)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}