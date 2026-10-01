"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import axios from "axios";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  HandCoins,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
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
  DeleteConfirmDialog,
  EmptyStateGeneral,
  PageSkeleton,
  TableSkeleton,
} from "@/shared/components/ui/feedback";
import { usePaginatedList } from "@/shared/hooks/use-pagination";
import { hasPermission } from "@/shared/lib/auth";
import { getErrorMessage } from "@/shared/lib/axios";
import { cn } from "@/shared/lib/utils";

import {
  createSettlement,
  deleteSettlement,
  updateSettlement,
} from "@/features/settlement/api";
import { InvestorSettlementList } from "@/features/settlement/InvestorSettlementList";
import {
  PortfolioPdfDialog,
  type PortfolioPdfTarget,
} from "@/features/settlement/PortfolioPdfDialog";
import {
  settlementProjectOptionsQuery,
  settlementsQuery,
} from "@/features/settlement/queries";
import { SettlementDetailSheet } from "@/features/settlement/SettlementDetailSheet";
import { SettlementFormDialog } from "@/features/settlement/SettlementFormDialog";
import type {
  ProjectSettlement,
  ProjectSettlementStatus,
  SettlementPayload,
  SettlementUpdatePayload,
} from "@/features/settlement/types";
import {
  formatDateID,
  formatRupiah,
  isNegative,
  isSettlementEditable,
  profitModelLabel,
  settlementStatusBadgeClass,
  settlementStatusLabel,
} from "@/features/settlement/utils";

export default function AdminSettlementRoute() {
  return (
    <ClientGuard
      requirePermission="project_settlements:read:any"
      fallback={<PageSkeleton />}
    >
      {/* useSearchParams (?project=) wajib berada di dalam Suspense */}
      <Suspense fallback={<PageSkeleton />}>
        <SettlementPage />
      </Suspense>
    </ClientGuard>
  );
}

const PAGE_SIZE = 10;

const STATUS_CARDS: {
  status: ProjectSettlementStatus;
  icon: LucideIcon;
  className: string;
}[] = [
  { status: "review", icon: Clock, className: "bg-warning/15 text-warning" },
  {
    status: "approved",
    icon: CheckCircle2,
    className: "bg-success/15 text-success",
  },
  { status: "rejected", icon: XCircle, className: "bg-danger/15 text-danger" },
];

function SettlementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: settlements } = useSuspenseQuery(settlementsQuery);

  const canCreate = hasPermission("project_settlements:create:any");
  const canUpdate = hasPermission("project_settlements:update:any");
  const canDelete = hasPermission("project_settlements:delete:any");
  const canApprove = hasPermission("project_settlements:approve:any");
  const canViewInvestors = hasPermission("investor_settlements:read:any");

  // Opsi proyek hanya dibutuhkan pembuat settlement (BOD tidak membuat)
  const { data: projectOptions = [] } = useQuery({
    ...settlementProjectOptionsQuery,
    enabled: canCreate,
  });

  const [tab, setTab] = useState("proyek");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ProjectSettlementStatus | "all"
  >("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSettlement | null>(
    null,
  );
  const [initialProjectId, setInitialProjectId] = useState<string | null>(null);
  const [pdfTarget, setPdfTarget] = useState<PortfolioPdfTarget | null>(null);

  // Datang dari halaman Proyek (?project=<id>): buka settlement-nya, atau form buat baru
  const projectParam = searchParams.get("project");
  const [handledProject, setHandledProject] = useState<string | null>(null);
  if (projectParam && projectParam !== handledProject) {
    setHandledProject(projectParam);
    const existing = settlements.find((s) => s.projectId === projectParam);
    if (existing) {
      setDetailId(existing.settlementId);
    } else if (canCreate) {
      setFormMode("create");
      setEditingId(null);
      setInitialProjectId(projectParam);
      setFormOpen(true);
    }
  }

  // Bersihkan query string agar refresh tidak membuka ulang dialog
  useEffect(() => {
    if (projectParam) router.replace("/admin/settlement", { scroll: false });
  }, [projectParam, router]);

  // Satu proyek hanya boleh punya satu settlement
  const availableProjects = useMemo(() => {
    const settled = new Set(settlements.map((s) => s.projectId));
    return projectOptions.filter((p) => !settled.has(p.projectId));
  }, [projectOptions, settlements]);

  const statusCounts = useMemo(() => {
    const counts: Record<ProjectSettlementStatus, number> = {
      review: 0,
      approved: 0,
      rejected: 0,
    };
    for (const s of settlements) counts[s.status] += 1;
    return counts;
  }, [settlements]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return settlements.filter((s) => {
      const matchQ =
        !q ||
        s.projectKey.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [settlements, search, statusFilter]);

  const { setPage, pageItems, totalPages, currentPage, start } =
    usePaginatedList(filtered, PAGE_SIZE);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
    queryClient.invalidateQueries({
      queryKey: ["admin", "investor-settlements"],
    });
  };

  const handleMutationError = (err: unknown, fallback: string) => {
    // 409: proyek sudah punya settlement / status sudah berubah — muat ulang data
    if (axios.isAxiosError(err) && err.response?.status === 409) refresh();
    toast.error(getErrorMessage(err, fallback));
  };

  const createMutation = useMutation({
    mutationFn: (payload: SettlementPayload) => createSettlement(payload),
    onSuccess: (result) => {
      refresh();
      toast.success("Settlement dibuat dan menunggu approval BOD.");
      setFormOpen(false);
      setPage(1);
      setDetailId(result.settlement.settlementId);
    },
    onError: (err) => handleMutationError(err, "Gagal membuat settlement."),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SettlementUpdatePayload;
    }) => updateSettlement(id, payload),
    onSuccess: (result) => {
      refresh();
      toast.success("Settlement diperbarui dan menunggu approval ulang.");
      setFormOpen(false);
      setDetailId(result.settlement.settlementId);
    },
    onError: (err) => handleMutationError(err, "Gagal menyimpan settlement."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSettlement(id),
    onSuccess: () => {
      refresh();
      toast.success("Settlement berhasil dihapus.");
      setDeleteTarget(null);
    },
    onError: (err) => {
      handleMutationError(err, "Gagal menghapus settlement.");
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setInitialProjectId(null);
    setFormOpen(true);
  };

  const openEdit = (settlement: ProjectSettlement) => {
    setDetailId(null);
    setFormMode("edit");
    setEditingId(settlement.settlementId);
    setFormOpen(true);
  };

  const openDelete = (settlement: ProjectSettlement) => {
    setDetailId(null);
    setDeleteTarget(settlement);
  };

  const handleSubmit = (payload: SettlementPayload) => {
    if (formMode === "edit" && editingId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { project_id, ...rest } = payload;
      updateMutation.mutate({ id: editingId, payload: rest });
    } else {
      createMutation.mutate(payload);
    }
  };

  const settlementTable = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {STATUS_CARDS.map(({ status, icon: Icon, className }) => {
          const active = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(active ? "all" : status);
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left shadow-card transition hover:border-brand/40",
                active && "border-brand ring-1 ring-brand",
              )}
            >
              <div
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  className,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {settlementStatusLabel[status]}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {statusCounts[status]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari kode proyek atau perusahaan…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9"
            />
          </div>
          {statusFilter !== "all" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
            >
              Tampilkan semua status
            </Button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyek</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Laba Bersih</TableHead>
                <TableHead className="text-right">Porsi Investor</TableHead>
                <TableHead className="text-right">Laba Final Koaci</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64">
                    <EmptyStateGeneral
                      title="Belum ada settlement"
                      description={
                        settlements.length === 0
                          ? "Buat settlement saat proyek selesai untuk membagikan hasil ke pemohon, Koaci, dan investor."
                          : "Tidak ada settlement yang cocok dengan filter."
                      }
                      icon={HandCoins}
                      action={
                        canCreate && settlements.length === 0 ? (
                          <Button variant="primary" size="sm" onClick={openCreate}>
                            <Plus className="h-4 w-4" /> Buat Settlement
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((s) => {
                  const editable = isSettlementEditable(s.status);
                  return (
                    <TableRow key={s.settlementId}>
                      <TableCell>
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => setDetailId(s.settlementId)}
                        >
                          <div className="font-mono text-sm font-medium text-foreground hover:text-brand">
                            {s.projectKey}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.companyName} · {s.investorCount} investor
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {profitModelLabel(s.profitModel)}
                      </TableCell>
                      <AmountCell value={s.netProfitMargin} />
                      <AmountCell value={s.investorPortionAmount} />
                      <AmountCell value={s.koaciFinalProfit} />
                      <TableCell>
                        <Badge
                          className={cn(settlementStatusBadgeClass(s.status))}
                        >
                          {settlementStatusLabel[s.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {s.createdByName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateID(s.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Aksi settlement ${s.projectKey}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {s.status === "review" && canApprove ? (
                              <DropdownMenuItem
                                onClick={() => setDetailId(s.settlementId)}
                              >
                                <ClipboardCheck className="mr-2 h-4 w-4" />{" "}
                                Tinjau & Setujui
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setDetailId(s.settlementId)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                              </DropdownMenuItem>
                            )}
                            {editable && canUpdate ? (
                              <DropdownMenuItem onClick={() => openEdit(s)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                            ) : null}
                            {editable && canDelete ? (
                              <DropdownMenuItem
                                className="text-danger focus:text-danger"
                                onClick={() => openDelete(s)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
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

        {pageItems.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan{" "}
              <span className="font-medium text-foreground">
                {start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)}
              </span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              settlement
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
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settlement Proyek
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tahap penyelesaian proyek: hitung pembagian hasil, ajukan approval,
            lalu hasil investor menjadi final.
          </p>
        </div>
        {canCreate ? (
          <Button variant="primary" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Buat Settlement
          </Button>
        ) : null}
      </header>

      {canViewInvestors ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="proyek">Settlement Proyek</TabsTrigger>
            <TabsTrigger value="investor">Portofolio Investor</TabsTrigger>
          </TabsList>
          <TabsContent value="proyek" className="mt-4">
            {settlementTable}
          </TabsContent>
          <TabsContent value="investor" className="mt-4">
            <Suspense fallback={<TableSkeleton />}>
              <InvestorSettlementList
                onOpenSettlement={setDetailId}
                onDownloadPortfolio={setPdfTarget}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      ) : (
        settlementTable
      )}

      <SettlementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        settlementId={editingId}
        projectOptions={availableProjects}
        initialProjectId={initialProjectId}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <SettlementDetailSheet
        settlementId={detailId}
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
        onEdit={openEdit}
        onDelete={openDelete}
        onDownloadPortfolio={(investorSettlementId) =>
          detailId && setPdfTarget({ settlementId: detailId, investorSettlementId })
        }
        canUpdate={canUpdate}
        canDelete={canDelete}
        canApprove={canApprove}
      />

      <PortfolioPdfDialog
        target={pdfTarget}
        onOpenChange={(o) => !o && setPdfTarget(null)}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(isOpen) =>
          !isOpen && !deleteMutation.isPending && setDeleteTarget(null)
        }
        title="Hapus Settlement"
        description={
          <>
            Yakin menghapus settlement proyek{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.projectKey}
            </span>
            ? Seluruh hasil investor pada settlement ini ikut terhapus.
          </>
        }
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.settlementId)
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

function AmountCell({ value }: Readonly<{ value: string }>) {
  return (
    <TableCell
      className={cn(
        "text-right text-sm tabular-nums text-foreground",
        isNegative(value) && "text-danger",
      )}
    >
      {formatRupiah(value)}
    </TableCell>
  );
}
