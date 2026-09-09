"use client";

import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, FileText, FolderKanban } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

import { ClientGuard } from "@/shared/components/ClientGuard";
import { EmptyStateGeneral, PageSkeleton, DeleteConfirmDialog } from "@/shared/components/ui/feedback";
import { usePaginatedList } from "@/shared/hooks/use-pagination";

import { ProjectDetailSheet } from "@/features/project-management/ProjectDetailSheet";
import { ProjectFormDialog } from "@/features/project-management/ProjectFormDialog";
import { ProjectDocumentsPanel } from "@/features/project-management/ProjectDocumentsPanel";
import { createProject, deleteProject, fetchCompanyOptions, fetchProjects, updateProject } from "@/features/project-management/api";
import type { Project, ProjectFormValues, ProjectStatus } from "@/features/project-management/types";
import { projectStatusLabel, projectStatusOptions } from "@/features/project-management/types";
import { fundingProgress, projectStatusBadgeClass } from "@/features/project-management/utils";
import { hasPermission } from "@/shared/lib/auth";
import { formatDateID, formatIDR } from "@/shared/lib/format";

const projectsQuery = queryOptions({
  queryKey: ["admin", "projects"],
  queryFn: () => fetchProjects(),
});

const companiesQuery = queryOptions({
  queryKey: ["admin", "companies", "options"],
  queryFn: fetchCompanyOptions,
});

export default function AdminProyekRoute() {
  return (
    <ClientGuard requirePermission="projects:read" fallback={<PageSkeleton />}>
      <ProjectsPage />
    </ClientGuard>
  );
}

const PAGE_SIZE = 10;

function ProjectsPage() {
  const queryClient = useQueryClient();
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const { data: companies } = useSuspenseQuery(companiesQuery);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const [activeTab, setActiveTab] = useState<string>("proyek");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Project | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [selectedDocProjectId, setSelectedDocProjectId] = useState<string>(projects[0]?.projectId ?? "");

  const canCreate = hasPermission("projects:create");
  const canUpdate = hasPermission("projects:update");
  const canDelete = hasPermission("projects:delete");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchQ = !q || p.projectKey.toLowerCase().includes(q) || (p.companyName ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchCompany = companyFilter === "all" || p.companyId === companyFilter;
      return matchQ && matchStatus && matchCompany;
    });
  }, [projects, search, statusFilter, companyFilter]);

  const { setPage, pageItems, totalPages, currentPage, start } = usePaginatedList(filtered, PAGE_SIZE);

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (values: ProjectFormValues) => createProject(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      toast.success("Proyek berhasil dibuat!");
      setFormOpen(false);
      setPage(1);
    },
    onError: () => toast.error("Gagal membuat proyek."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) => updateProject(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      toast.success("Proyek berhasil diperbarui!");
      setFormOpen(false);
    },
    onError: () => toast.error("Gagal memperbarui proyek."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
      toast.success("Proyek berhasil dihapus.");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Gagal menghapus proyek."),
  });

  const handleSubmit = (values: ProjectFormValues) => {
    if (formMode === "edit" && editing) updateMutation.mutate({ id: editing.projectId, values });
    else createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Manajemen Proyek</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola seluruh proyek pembiayaan Koaci.</p>
        </div>
        {canCreate ? (
          <Button variant="primary" onClick={() => { setFormMode("create"); setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Tambah Proyek
          </Button>
        ) : null}
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="proyek">Daftar Proyek</TabsTrigger>
          <TabsTrigger value="dokumen">Dokumen Proyek</TabsTrigger>
        </TabsList>

        <TabsContent value="proyek" className="space-y-0">
          <div className="rounded-2xl border border-border bg-background shadow-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Cari kode atau nama proyek…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 pl-9" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as ProjectStatus | "all"); setPage(1); }}>
                  <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder="Semua Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {projectStatusOptions.map((s: ProjectStatus) => (
                      <SelectItem key={s} value={s}>{projectStatusLabel[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={companyFilter} onValueChange={(v) => { setCompanyFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 w-full sm:w-56"><SelectValue placeholder="Semua Perusahaan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Perusahaan</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.companyId} value={c.companyId}>{c.companyName}</SelectItem>
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
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64">
                        <EmptyStateGeneral 
                           title="Belum ada proyek" 
                           description="Tambahkan proyek pembiayaan pertama untuk mulai mengelola pendanaan." 
                           icon={FolderKanban}
                           action={canCreate ? <Button variant="primary" size="sm" onClick={() => { setFormMode("create"); setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah Proyek</Button> : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((p) => {
                      const progress = fundingProgress(p.aggregateFundAmount, p.fundingRequired);
                      return (
                        <TableRow key={p.projectId}>
                          <TableCell>
                            <div className="font-mono text-sm font-medium text-foreground">{p.projectKey}</div>
                            <div className="text-xs text-muted-foreground">{formatDateID(p.createdAt)}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.companyName ?? p.companyId}</TableCell>
                          <TableCell className="text-sm text-foreground">{formatIDR(p.fundingRequired)}</TableCell>
                          <TableCell className="text-sm text-foreground">{formatIDR(p.aggregateFundAmount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="h-2 w-20" />
                              <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(projectStatusBadgeClass[p.status])}>{projectStatusLabel[p.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetail(p)}><Eye className="mr-2 h-4 w-4" /> Lihat Detail</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedDocProjectId(p.projectId); setActiveTab("dokumen"); }}>
                                  <FileText className="mr-2 h-4 w-4" /> Lihat Dokumen
                                </DropdownMenuItem>
                                {canUpdate && <DropdownMenuItem onClick={() => { setFormMode("edit"); setEditing(p); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                                {canDelete && <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => setDeleteTarget(p)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>}
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

            {pageItems.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Menampilkan <span className="font-medium text-foreground">{start + 1}-{start + pageItems.length}</span> dari <span className="font-medium text-foreground">{filtered.length}</span> proyek
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
                  <span className="text-xs text-muted-foreground">Hal. {currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dokumen" className="space-y-0">
          <ProjectDocumentsPanel projects={projects} selectedId={selectedDocProjectId} onSelectedIdChange={setSelectedDocProjectId} />
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} mode={formMode} initialProject={editing} companies={companies} onSubmit={handleSubmit} />

      <ProjectDetailSheet project={detail} open={detail !== null} onOpenChange={(o) => !o && setDetail(null)} />

      {/* ✅ Menggunakan Global Delete Dialog */}
      <DeleteConfirmDialog 
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && !deleteMutation.isPending && setDeleteTarget(null)}
        title="Hapus Proyek"
        description={
          <>Yakin menghapus proyek <span className="font-medium text-foreground">{deleteTarget?.projectKey}</span>? Tindakan ini permanen, dan seluruh dokumen yang terkait akan dihapus.</>
        }
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.projectId)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}