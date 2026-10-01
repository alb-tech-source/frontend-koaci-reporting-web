import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  FileDown,
  Loader2,
  Lock,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { getErrorMessage } from "@/shared/lib/axios";
import { cn } from "@/shared/lib/utils";

import { approveSettlement, rejectSettlement } from "./api";
import { settlementDetailQuery } from "./queries";
import { SettlementBreakdown } from "./SettlementBreakdown";
import type { ProjectSettlement } from "./types";
import {
  formatDateID,
  formatPct,
  formatRupiah,
  isNegative,
  isSettlementEditable,
  profitModelLabel,
  settlementStatusBadgeClass,
  settlementStatusLabel,
} from "./utils";

interface SettlementDetailSheetProps {
  settlementId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (settlement: ProjectSettlement) => void;
  onDelete: (settlement: ProjectSettlement) => void;
  /** Unduh surat portofolio akhir investor (hanya untuk settlement approved). */
  onDownloadPortfolio: (investorSettlementId: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

type Decision = "approve" | "reject";

export function SettlementDetailSheet({
  settlementId,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onDownloadPortfolio,
  canUpdate,
  canDelete,
  canApprove,
}: Readonly<SettlementDetailSheetProps>) {
  const queryClient = useQueryClient();
  const { data: settlement, isLoading } = useQuery({
    ...settlementDetailQuery(settlementId ?? ""),
    enabled: open && !!settlementId,
  });
  const [decision, setDecision] = useState<Decision | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
    queryClient.invalidateQueries({
      queryKey: ["admin", "investor-settlements"],
    });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: Decision }) =>
      action === "approve" ? approveSettlement(id) : rejectSettlement(id),
    onSuccess: (_, { action }) => {
      refresh();
      toast.success(
        action === "approve"
          ? "Settlement disetujui. Hasil investor kini final."
          : "Settlement ditolak dan dikembalikan ke admin untuk diperbaiki.",
      );
      setDecision(null);
    },
    onError: (err: unknown) => {
      // 409: status sudah diubah user lain — muat ulang detail
      if (axios.isAxiosError(err) && err.response?.status === 409) refresh();
      toast.error(getErrorMessage(err, "Gagal memproses settlement."));
      setDecision(null);
    },
  });

  const editable = settlement ? isSettlementEditable(settlement.status) : false;
  const showReview = settlement?.status === "review" && canApprove;
  const showEdit = editable && canUpdate;
  const showDelete = editable && canDelete;
  const canDownload = settlement?.status === "approved";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        {isLoading || !settlement ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <SheetHeader className="text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="font-mono text-lg">
                    {settlement.projectKey}
                  </SheetTitle>
                  <Badge
                    className={cn(settlementStatusBadgeClass(settlement.status))}
                  >
                    {settlementStatusLabel[settlement.status]}
                  </Badge>
                </div>
                <SheetDescription>{settlement.companyName}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <StatusBanner settlement={settlement} canApprove={canApprove} />

                <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4">
                  <InfoItem
                    label="Model Keuntungan"
                    value={profitModelLabel(settlement.profitModel)}
                  />
                  <InfoItem
                    label="Jumlah Investor"
                    value={`${settlement.investors.length} investor`}
                  />
                  <InfoItem
                    label="Dibuat Oleh"
                    value={`${settlement.createdByName} · ${formatDateID(settlement.createdAt)}`}
                  />
                  <InfoItem
                    label="Disetujui Oleh"
                    value={settlement.approvedByName ?? "—"}
                  />
                </div>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Rincian Perhitungan
                  </h3>
                  <SettlementBreakdown data={settlement} />
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Hasil per Investor
                  </h3>
                  {settlement.investors.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Tidak ada investor pada settlement ini.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Investor</TableHead>
                            <TableHead className="text-right">Modal</TableHead>
                            <TableHead className="text-right">
                              Bagi Hasil
                            </TableHead>
                            <TableHead className="text-right">
                              Kompensasi
                            </TableHead>
                            <TableHead className="text-right">
                              Total Diterima
                            </TableHead>
                            {canDownload ? (
                              <TableHead className="w-12 text-right">
                                PDF
                              </TableHead>
                            ) : null}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settlement.investors.map((inv) => (
                            <TableRow key={inv.investorSettlementId}>
                              <TableCell>
                                <div className="text-sm font-medium text-foreground">
                                  {inv.investorName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {inv.investorEmail}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm tabular-nums">
                                {formatRupiah(inv.principalAmount)}
                                <div className="text-xs text-muted-foreground">
                                  {formatPct(inv.modalPortionPct)}
                                </div>
                              </TableCell>
                              <AmountCell value={inv.profitShareAmount} />
                              <TableCell className="text-right text-sm tabular-nums">
                                {formatRupiah(inv.compensationAmount)}
                                {Number(inv.compensationPct) !== 0 ? (
                                  <div className="text-xs text-muted-foreground">
                                    {formatPct(inv.compensationPct)}
                                  </div>
                                ) : null}
                              </TableCell>
                              <AmountCell value={inv.totalProfit} strong />
                              {canDownload ? (
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Unduh portofolio ${inv.investorName}`}
                                    title="Unduh portofolio akhir (PDF)"
                                    onClick={() =>
                                      onDownloadPortfolio(inv.investorSettlementId)
                                    }
                                  >
                                    <FileDown className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              ) : null}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {showReview || showEdit || showDelete ? (
              <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
                {showDelete ? (
                  <Button
                    variant="ghost"
                    className="text-danger hover:text-danger sm:mr-auto"
                    onClick={() => onDelete(settlement)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Hapus
                  </Button>
                ) : null}
                {showEdit ? (
                  <Button variant="outline" onClick={() => onEdit(settlement)}>
                    <Pencil className="mr-1.5 h-4 w-4" />
                    {settlement.status === "rejected"
                      ? "Perbaiki & Ajukan Ulang"
                      : "Edit"}
                  </Button>
                ) : null}
                {showReview ? (
                  <>
                    <Button
                      variant="outline"
                      className="border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
                      onClick={() => setDecision("reject")}
                    >
                      <XCircle className="mr-1.5 h-4 w-4" /> Tolak
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setDecision("approve")}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Setujui
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </SheetContent>

      <AlertDialog
        open={decision !== null}
        onOpenChange={(o) => {
          if (!o && !reviewMutation.isPending) setDecision(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision === "approve"
                ? "Setujui settlement ini?"
                : "Tolak settlement ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision === "approve" ? (
                <>
                  Settlement{" "}
                  <span className="font-medium text-foreground">
                    {settlement?.projectKey}
                  </span>{" "}
                  akan dikunci dan tidak dapat diubah atau dihapus lagi. Hasil
                  bagi hasil akan menjadi final dan terlihat oleh investor.
                </>
              ) : (
                <>
                  Settlement dikembalikan ke admin untuk diperbaiki. Sampaikan
                  alasan penolakan kepada admin secara langsung, karena sistem
                  tidak menyimpan catatan alasan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                decision === "reject" && "bg-danger text-white hover:bg-danger/90",
              )}
              disabled={reviewMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (settlement && decision)
                  reviewMutation.mutate({
                    id: settlement.settlementId,
                    action: decision,
                  });
              }}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : decision === "approve" ? (
                "Ya, Setujui"
              ) : (
                "Ya, Tolak"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function StatusBanner({
  settlement,
  canApprove,
}: Readonly<{ settlement: ProjectSettlement; canApprove: boolean }>) {
  const config: Record<
    ProjectSettlement["status"],
    { icon: ReactNode; className: string; text: string }
  > = {
    review: {
      icon: <Clock className="h-4 w-4 shrink-0" />,
      className: "border-warning/30 bg-warning/5 text-warning",
      text: canApprove
        ? "Settlement ini menunggu persetujuan Anda. Periksa rincian di bawah sebelum menyetujui."
        : "Settlement ini sedang menunggu persetujuan BOD.",
    },
    rejected: {
      icon: <XCircle className="h-4 w-4 shrink-0" />,
      className: "border-danger/30 bg-danger/5 text-danger",
      text: "Settlement ditolak. Admin dapat memperbaiki data lalu mengajukan ulang.",
    },
    approved: {
      icon: <Lock className="h-4 w-4 shrink-0" />,
      className: "border-success/30 bg-success/5 text-success",
      text: `Disetujui oleh ${settlement.approvedByName ?? "BOD"} · ${formatDateID(settlement.updatedAt)}. Data terkunci dan hasil investor sudah final.`,
    },
  };
  const { icon, className, text } = config[settlement.status];

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3 text-sm",
        className,
      )}
    >
      {icon}
      <p>{text}</p>
    </div>
  );
}

function InfoItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function AmountCell({
  value,
  strong = false,
}: Readonly<{ value: string; strong?: boolean }>) {
  return (
    <TableCell
      className={cn(
        "text-right text-sm tabular-nums",
        strong && "font-semibold",
        isNegative(value) && "text-danger",
      )}
    >
      {formatRupiah(value)}
    </TableCell>
  );
}
