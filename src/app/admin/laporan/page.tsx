"use client";

import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Eye, FileBarChart, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { DeleteConfirmDialog, EmptyStateGeneral, PageSkeleton } from "@/shared/components/ui/feedback";
import { usePaginatedList } from "@/shared/hooks/use-pagination";
import { hasPermission } from "@/shared/lib/auth";

import { createReporting, deleteReporting, fetchProjectOptions, fetchReportings, updateReporting } from "@/features/project-reporting/api";
import { ReportingDetailSheet } from "@/features/project-reporting/ReportingDetailSheet";
import { ReportingFormDialog } from "@/features/project-reporting/ReportingFormDialog";
import type { ProjectReporting, ReportingFormValues, ReportingUpdateValues } from "@/features/project-reporting/types";
import { formatDateID, formatIDR, progressIndicatorClass } from "@/features/project-reporting/utils";

const reportingsQuery = queryOptions({
  queryKey: ["admin", "reportings"],
  queryFn: () => fetchReportings(),
});

const projectOptionsQuery = queryOptions({
  queryKey: ["admin", "reportings", "project-options"],
  queryFn: fetchProjectOptions,
});

export default function AdminLaporanRoute() {
  return (
    <ClientGuard requirePermission="project_reportings:read:any" fallback={<PageSkeleton />}>
      <ReportingListPage />
    </ClientGuard>
  );
}

const PAGE_SIZE = 10;

function ReportingListPage() {
  const queryClient = useQueryClient();
  const { data: items } = useSuspenseQuery(reportingsQuery);
  const { data: projectOptions } = useSuspenseQuery(projectOptionsQuery);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ProjectReporting | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectReporting | null>(null);

  const canCreate = hasPermission("project_reportings:create:any");
  const canUpdate = hasPermission("project_reportings:update:any");
  const canDelete = hasPermission("project_reportings:delete:any");
  const canUploadMedia = hasPermission("project_reporting_media:upload:any");
  const canDeleteMedia = hasPermission("project_reporting_media:delete:any");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      const matchQ =
        !q ||
        r.projectKey.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q) ||
        r.narrativeSummary.toLowerCase().includes(q);
      const matchProject = projectFilter === "all" || r.projectId === projectFilter;
      return matchQ && matchProject;
    });
  }, [items, search, projectFilter]);

  const { setPage, pageItems, totalPages, currentPage, start } = usePaginatedList(filtered, PAGE_SIZE);

  const detail = items.find((r) => r.reportingId === detailId) ?? null;

  const createMutation = useMutation({
    mutationFn: (values: ReportingFormValues) => createReporting(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reportings"] });
      toast.success("Laporan berhasil dibuat!");
      setFormOpen(false);
      setPage(1);
    },
    onError: () => toast.error("Gagal membuat laporan."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ReportingUpdateValues }) => updateReporting(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reportings"] });
      toast.success("Laporan berhasil diperbarui!");
      setFormOpen(false);
      setEditing(null);
    },
    onError: () => toast.error("Gagal memperbarui laporan."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReporting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reportings"] });
      toast.success("Laporan berhasil dihapus.");
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      if (status === 409) {
        toast.error("Hapus semua media laporan terlebih dahulu sebelum menghapus laporan.");
      } else {
        toast.error("Gagal menghapus laporan.");
      }
      setDeleteTarget(null);
    },
  });

  const handleSubmit = (values: ReportingFormValues | ReportingUpdateValues) => {
    if (formMode === "edit" && editing) {
      updateMutation.mutate({ id: editing.reportingId, values: values as ReportingUpdateValues });
    } else {
      createMutation.mutate(values as ReportingFormValues);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Laporan Progress Proyek</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pantau kemajuan seluruh proyek pembiayaan Koaci.</p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => { setFormMode("create"); setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Laporan
          </Button>
        )}
      </header>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari proyek atau narasi…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 pl-9"
            />
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
                <TableHead>Proyek</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Dana Tersalurkan</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Dilaporkan</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <EmptyStateGeneral
                      title="Belum ada laporan"
                      description="Buat laporan pertama untuk mulai memantau kemajuan proyek."
                      icon={FileBarChart}
                      action={canCreate ? <Button variant="primary" size="sm" onClick={() => { setFormMode("create"); setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah Laporan</Button> : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((r) => (
                  <TableRow key={r.reportingId}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-foreground">{r.projectKey}</div>
                      <div className="text-xs text-muted-foreground">{r.companyName || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateID(r.reportDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={r.estimateProgressPercentage} className={`h-2 w-16 ${progressIndicatorClass(r.estimateProgressPercentage)}`} />
                        <span className="text-xs font-medium text-muted-foreground">{r.estimateProgressPercentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{formatIDR(r.fundDisbursed)}</TableCell>
                    <TableCell>
                      {r.projectReportingMedia.length > 0 ? (
                        <Badge className="border-transparent bg-brand/10 text-brand">{r.projectReportingMedia.length} file</Badge>
                      ) : (
                        <Badge className="border-transparent bg-muted text-muted-foreground">Belum ada</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.submittedByName || "—"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi laporan ${r.projectKey}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailId(r.reportingId)}><Eye className="mr-2 h-4 w-4" /> Lihat Detail</DropdownMenuItem>
                          {canUpdate && <DropdownMenuItem onClick={() => { setFormMode("edit"); setEditing(r); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                          {canDelete && <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => setDeleteTarget(r)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>}
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
            <p className="text-xs text-muted-foreground">
              Menampilkan <span className="font-medium text-foreground">{start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)}</span> dari <span className="font-medium text-foreground">{filtered.length}</span> laporan
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
              <span className="text-xs text-muted-foreground">Hal. {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</Button>
            </div>
          </div>
        )}
      </div>

      <ReportingFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        mode={formMode} 
        initialValue={editing} 
        projectOptions={projectOptions} 
        onSubmit={handleSubmit} 
        isSubmitting={createMutation.isPending || updateMutation.isPending} 
      />

      <ReportingDetailSheet 
        reporting={detail} 
        open={detail !== null} 
        onOpenChange={(o) => !o && setDetailId(null)} 
        canUploadMedia={canUploadMedia} 
        canDeleteMedia={canDeleteMedia} 
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && !deleteMutation.isPending && setDeleteTarget(null)}
        title="Hapus Laporan Proyek"
        description={
          <>Yakin menghapus laporan proyek <span className="font-semibold text-foreground">{deleteTarget?.projectKey}</span> tertanggal <span className="font-semibold text-foreground">{deleteTarget && formatDateID(deleteTarget.reportDate)}</span>? Pastikan semua media pendukung telah dihapus. Tindakan ini permanen.</>
        }
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.reportingId)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}