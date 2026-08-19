"use client";

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, MoreHorizontal, Plus, Search } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner"; 

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import { CompanyFormDialog } from "@/features/company-management/CompanyFormDialog";
import { LegalDocumentsPanel } from "@/features/company-management/LegalDocumentsPanel";
import { fetchCompanies, createCompany, deleteCompany } from "@/features/company-management/api";
import type {
  Company,
  NewCompanyInput,
  CompanyStatus // ✅ Ganti LegalStatus menjadi CompanyStatus
} from "@/features/company-management/types";

// Fungsi mapper status sementara karena type utils berubah
function getStatusLabel(status: CompanyStatus) {
  switch (status) {
    case "active": return "Valid / Aktif";
    case "inactive": return "Tidak Aktif";
    case "blacklist": return "Blacklist";
    default: return status;
  }
}

function getStatusBadgeVariant(status: CompanyStatus) {
  switch (status) {
    case "active": return "success";
    case "inactive": return "outline";
    case "blacklist": return "danger";
    default: return "outline";
  }
}

const companiesQuery = queryOptions({
  queryKey: ["admin", "companies"],
  queryFn: () => fetchCompanies(1, 100),
});

export default function AdminPerusahaanRoute() {
  return (
      <Suspense fallback={<PageSkeleton />}>
        <CompanyManagementPage />
      </Suspense>
  );
}

const PAGE_SIZE = 5;

function CompanyManagementPage() {
  const { data: raw } = useSuspenseQuery(companiesQuery);
  const [companies, setCompanies] = useState<Company[]>(raw.items);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | "all">("all");
  const [page, setPage] = useState(1);
  
  // State Dialog & Hapus
  const [open, setOpen] = useState(false);
  const [selectedDocCompanyId, setSelectedDocCompanyId] = useState<string>(
    raw.items[0]?.id ?? "", // ✅ FIX: Ganti `data` menjadi `raw.items`
  );
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      const matchQ =
        !q ||
        c.nama.toLowerCase().includes(q) ||
        c.sektor.toLowerCase().includes(q);
      // ✅ FIX: Ganti `statusLegalitas` menjadi `status`
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [companies, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleAdd = async (input: NewCompanyInput) => {
    try {
      const created = await createCompany(input);
      setCompanies((prev) => [created, ...prev]);
      toast.success("Perusahaan berhasil ditambahkan!");
      setOpen(false);
    } catch {
      toast.error("Gagal menambahkan perusahaan.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCompany(deleteTarget.id);
      setCompanies((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success(`Perusahaan ${deleteTarget.nama} berhasil dihapus.`);
    } catch {
      toast.error("Gagal menghapus perusahaan.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
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
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Tambah Perusahaan
        </Button>
      </header>

      <Tabs defaultValue="perusahaan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="perusahaan">Daftar Perusahaan</TabsTrigger>
          <TabsTrigger value="dokumen">Dokumen Legalitas</TabsTrigger>
        </TabsList>

        <TabsContent value="perusahaan" className="space-y-0">
          <div className="rounded-2xl border border-border bg-background shadow-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
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
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        Tidak ada perusahaan yang cocok.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((cmp) => (
                      <TableRow key={cmp.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {cmp.nama}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cmp.id}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cmp.jenis}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cmp.sektor}
                        </TableCell>
                        <TableCell>
                          {/* ✅ FIX: Ganti dengan mapper fungsi baru */}
                          <Badge variant={getStatusBadgeVariant(cmp.status) as any}>
                            {getStatusLabel(cmp.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Aksi perusahaan"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() =>
                                  setSelectedDocCompanyId(cmp.id)
                                }
                              >
                                Lihat dokumen
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onSelect={() => toast.info("Fitur Edit Perusahaan dalam tahap pengembangan.")}
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

      {/* MODAL FORM */}
      <CompanyFormDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleAdd}
      />

      {/* MODAL KONFIRMASI HAPUS */}
      <Dialog open={deleteTarget !== null} onOpenChange={(isOpen) => !isOpen && !isDeleting && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <DialogTitle>Hapus Perusahaan</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus profil perusahaan <span className="font-semibold text-foreground">{deleteTarget?.nama}</span>? 
              Tindakan ini permanen dan akan menghapus semua dokumen yang terkait.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
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
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}