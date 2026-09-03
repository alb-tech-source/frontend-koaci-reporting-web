"use client";

import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Eye,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  FileText, // Ikon tambahan
  Loader2
} from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner"; // Tambahkan Sonner

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"; // Komponen Tabs

import { cn } from "@/shared/lib/utils";
import { hasPermission } from "@/shared/lib/auth";
import { ProjectDetailSheet } from "@/features/project-management/ProjectDetailSheet";
import { ProjectFormDialog } from "@/features/project-management/ProjectFormDialog";
import { ProjectDocumentsPanel } from "@/features/project-management/ProjectDocumentsPanel";
import {
  createProject,
  deleteProject,
  fetchCompanyOptions,
  fetchProjects,
  updateProject,
} from "@/features/project-management/api";
import type {
  Project,
  ProjectFormValues,
  ProjectStatus,
} from "@/features/project-management/types";
import {
  projectStatusLabel,
  projectStatusOptions,
} from "@/features/project-management/types";
import {
  formatDateID,
  formatIDR,
  fundingProgress,
  projectStatusBadgeClass,
} from "@/features/project-management/utils";

const projectsQuery = queryOptions({
  queryKey: ["admin", "projects"],
  queryFn: () => fetchProjects({ page: 1, limit: 100 }),
});

const companiesQuery = queryOptions({
  queryKey: ["admin", "companies", "options"],
  queryFn: fetchCompanyOptions,
});

export default function AdminProyekRoute() {
  return (
      <Suspense fallback={<PageSkeleton />}>
        {hasPermission("projects:read") ? <ProjectsPage /> : <AccessDenied />}
      </Suspense>
  );
}

const PAGE_SIZE = 10;

function ProjectsPage() {
  const { data: response } = useSuspenseQuery(projectsQuery);
  const { data: companies } = useSuspenseQuery(companiesQuery);

  const [projects, setProjects] = useState<Project[]>(response.data.items);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // States UI
  const [activeTab, setActiveTab] = useState<string>("proyek"); // State Tab
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Project | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  
  // State Dokumen Aktif
  const [selectedDocProjectId, setSelectedDocProjectId] = useState<string>(
    response.data.items[0]?.projectId ?? ""
  );

  const canCreate = hasPermission("projects:create");
  const canUpdate = hasPermission("projects:update");
  const canDelete = hasPermission("projects:delete");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchQ =
        !q ||
        p.projectKey.toLowerCase().includes(q) ||
        (p.companyName ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchCompany =
        companyFilter === "all" || p.companyId === companyFilter;
      return matchQ && matchStatus && matchCompany;
    });
  }, [projects, search, statusFilter, companyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  const isEmpty = pageItems.length === 0;

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (values: ProjectFormValues) => createProject(values),
    onSuccess: (created) => {
      setProjects((prev) => [created, ...prev]);
      toast.success("Proyek berhasil dibuat!");
      setFormOpen(false);
      setPage(1);
    },
    onError: () => toast.error("Gagal membuat proyek."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) => updateProject(id, values),
    onSuccess: (updated) => {
      setProjects((prev) => prev.map((p) => (p.projectId === updated.projectId ? updated : p)));
      toast.success("Proyek berhasil diperbarui!");
      setFormOpen(false);
    },
    onError: () => toast.error("Gagal memperbarui proyek."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_, id) => {
      setProjects((prev) => prev.filter((p) => p.projectId !== id));
      toast.success("Proyek berhasil dihapus.");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Gagal menghapus proyek."),
  });

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setFormMode("edit");
    setEditing(project);
    setFormOpen(true);
  };

  const handleSubmit = (values: ProjectFormValues) => {
    if (formMode === "edit" && editing) {
      updateMutation.mutate({ id: editing.projectId, values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Manajemen Proyek
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola seluruh proyek pembiayaan Koaci.
          </p>
        </div>
        {canCreate ? (
          <Button variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah Proyek
          </Button>
        ) : null}
      </header>

      {/* TABS VIEW */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="proyek">Daftar Proyek</TabsTrigger>
          <TabsTrigger value="dokumen">Dokumen Proyek</TabsTrigger>
        </TabsList>

        <TabsContent value="proyek" className="space-y-0">
          <div className="rounded-2xl border border-border bg-background shadow-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Cari kode atau nama proyek…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 pl-9"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as ProjectStatus | "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-44">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {projectStatusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {projectStatusLabel[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={companyFilter}
                  onValueChange={(v) => {
                    setCompanyFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-56">
                    <SelectValue placeholder="Semua Perusahaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Perusahaan</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.companyId} value={c.companyId}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Proyek</TableHead>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>Target Dana</TableHead>
                    <TableHead>Dana Terkumpul</TableHead>
                    <TableHead className="w-40">Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isEmpty ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64">
                        <EmptyState onAdd={canCreate ? openCreate : undefined} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((p) => {
                      const progress = fundingProgress(
                        p.aggregateFundAmount,
                        p.fundingRequired,
                      );
                      return (
                        <TableRow key={p.projectId}>
                          <TableCell>
                            <div className="font-mono text-sm font-medium text-foreground">
                              {p.projectKey}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateID(p.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.companyName ?? p.companyId}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {formatIDR(p.fundingRequired)}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {formatIDR(p.aggregateFundAmount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="h-2 w-20" />
                              <span className="text-xs font-medium text-muted-foreground">
                                {progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(projectStatusBadgeClass[p.status])}>
                              {projectStatusLabel[p.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Aksi ${p.projectKey}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetail(p)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                
                                {/* Shortcut ke Dokumen */}
                                <DropdownMenuItem onClick={() => {
                                  setSelectedDocProjectId(p.projectId);
                                  setActiveTab("dokumen");
                                }}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Lihat Dokumen
                                </DropdownMenuItem>

                                {canUpdate ? (
                                  <DropdownMenuItem onClick={() => openEdit(p)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                ) : null}
                                {canDelete ? (
                                  <DropdownMenuItem
                                    className="text-danger focus:text-danger"
                                    onClick={() => setDeleteTarget(p)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {!isEmpty && (
              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Menampilkan{" "}
                  <span className="font-medium text-foreground">
                    {start + 1}-{start + pageItems.length}
                  </span>{" "}
                  dari{" "}
                  <span className="font-medium text-foreground">
                    {filtered.length}
                  </span>{" "}
                  proyek
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
            )}
          </div>
        </TabsContent>

        <TabsContent value="dokumen" className="space-y-0">
          <ProjectDocumentsPanel 
            projects={projects}
            selectedId={selectedDocProjectId}
            onSelectedIdChange={setSelectedDocProjectId}
          />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialProject={editing}
        companies={companies}
        onSubmit={handleSubmit}
      />

      <ProjectDetailSheet
        project={detail}
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && !deleteMutation.isPending && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <DialogTitle>Hapus Proyek</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  Yakin menghapus proyek{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.projectKey}
                  </span>{" "}
                  ? Tindakan ini permanen, dan seluruh dokumen yang terkait akan dihapus.
                </>
              ) : (
                "Tindakan ini permanen, tidak bisa dibatalkan."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Batalkan
            </Button>
            <Button 
              variant="danger" 
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.projectId)}
              disabled={deleteMutation.isPending}
            >
               {deleteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ onAdd }: Readonly<{ onAdd?: () => void }>) {
  // ... (Tetap sama seperti aslinya)
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
        <FolderKanban className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">Belum ada proyek</p>
        <p className="text-sm text-muted-foreground">
          Tambahkan proyek pembiayaan pertama untuk mulai mengelola pendanaan.
        </p>
      </div>
      {onAdd ? (
        <Button variant="primary" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Tambah Proyek
        </Button>
      ) : null}
    </div>
  );
}

function AccessDenied() {
  // ... (Tetap sama seperti aslinya)
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-card">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-danger/10">
          <ShieldAlert className="h-6 w-6 text-danger" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Akses Ditolak
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anda tidak memiliki izin untuk melihat data proyek.
        </p>
      </div>
    </div>
  );
}

function PageSkeleton() {
  // ... (Tetap sama seperti aslinya)
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}