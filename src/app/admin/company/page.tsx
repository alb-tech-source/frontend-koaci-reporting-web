"use client";

import {
  queryOptions,
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ClientGuard } from "@/shared/components/ClientGuard";
import {
  EmptyStateGeneral,
  PageSkeleton,
  DeleteConfirmDialog,
} from "@/shared/components/ui/feedback";
import { getErrorMessage } from "@/shared/lib/axios";
import { usePaginatedList } from "@/shared/hooks/use-pagination";

import { CompanyFormDialog } from "@/features/company-management/CompanyFormDialog";
import { LegalDocumentsPanel } from "@/features/company-management/LegalDocumentsPanel";
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "@/features/company-management/api";
import type {
  Company,
  NewCompanyInput,
  CompanyStatus,
} from "@/features/company-management/types";
import {
  getCompanyStatusLabel,
  getCompanyStatusBadgeVariant,
} from "@/features/company-management/utils";

const companiesQuery = queryOptions({
  queryKey: ["admin", "companies"],
  queryFn: () => fetchCompanies(),
});

const PAGE_SIZE = 5;

export default function AdminPerusahaanRoute() {
  return (
    <ClientGuard
      requirePermission="companies:read:any"
      fallback={<PageSkeleton />}
    >
      <CompanyManagementPage />
    </ClientGuard>
  );
}

function CompanyManagementPage() {
  const queryClient = useQueryClient();
  const { data: companies } = useSuspenseQuery(companiesQuery);

  // State Dasar
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | "all">(
    "all",
  );
  const [activeTab, setActiveTab] = useState<string>("perusahaan");

  const [open, setOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingTarget, setEditingTarget] = useState<Company | null>(null);

  const [selectedDocCompanyId, setSelectedDocCompanyId] = useState<string>(
    companies[0]?.id ?? "",
  );
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      const matchQ =
        !q ||
        c.nama.toLowerCase().includes(q) ||
        c.sektor.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [companies, search, statusFilter]);

  const { setPage, pageItems, totalPages, currentPage } = usePaginatedList(
    filtered,
    PAGE_SIZE,
  );

  // --- MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: (payload: NewCompanyInput) => createCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      toast.success("Perusahaan berhasil ditambahkan!");
      setOpen(false);
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err, "Gagal menambahkan perusahaan.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<NewCompanyInput>;
    }) => updateCompany(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      toast.success("Perusahaan berhasil diperbarui!");
      setOpen(false);
      setEditingTarget(null);
    },
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err, "Gagal memperbarui perusahaan.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      toast.success("Perusahaan berhasil dihapus.");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Gagal menghapus perusahaan."),
  });

  const handleSubmitForm = (input: NewCompanyInput) => {
    if (formMode === "edit" && editingTarget)
      updateMutation.mutate({ id: editingTarget.id, payload: input });
    else createMutation.mutate(input);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Manajemen Perusahaan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola profil dan dokumen legalitas perusahaan mitra.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormMode("create");
            setEditingTarget(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Tambah Perusahaan
        </Button>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="perusahaan">Daftar Perusahaan</TabsTrigger>
          <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
        </TabsList>

        <TabsContent value="perusahaan" className="space-y-0">
          <div className="rounded-2xl border border-border bg-background shadow-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari nama atau sektor…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as CompanyStatus | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-52">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Valid / Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  <SelectItem value="blacklist">Blacklist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Perusahaan</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Sektor Industri</TableHead>
                    <TableHead>Status Legalitas</TableHead>
                    <TableHead className="w-16 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64">
                        <EmptyStateGeneral
                          title="Belum ada perusahaan"
                          description="Tidak ada data yang cocok dengan pencarian Anda."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((cmp) => (
                      <TableRow key={cmp.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {cmp.nama || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cmp.jenis}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cmp.sektor}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getCompanyStatusBadgeVariant(cmp.status)}
                          >
                            {getCompanyStatusLabel(cmp.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedDocCompanyId(cmp.id);
                                  setActiveTab("dokumen");
                                }}
                              >
                                Lihat dokumen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditingTarget(cmp);
                                  setFormMode("edit");
                                  setOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-danger focus:text-danger"
                                onSelect={() => setDeleteTarget(cmp)}
                              >
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

            {pageItems.length > 0 && (
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
                  perusahaan
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
          <LegalDocumentsPanel
            companies={companies}
            selectedId={selectedDocCompanyId}
            onSelectedIdChange={setSelectedDocCompanyId}
          />
        </TabsContent>
      </Tabs>

      <CompanyFormDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setEditingTarget(null);
        }}
        mode={formMode}
        initialData={editingTarget}
        onSubmit={handleSubmitForm}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}
        title="Hapus Perusahaan"
        description={
          <>
            Yakin ingin menghapus profil perusahaan{" "}
            <span className="font-semibold text-foreground">
              {deleteTarget?.nama}
            </span>
            ? Tindakan ini permanen.
          </>
        }
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
