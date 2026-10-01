import { useSuspenseQuery } from "@tanstack/react-query";
import { Eye, FileDown, Search, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { EmptyStateGeneral } from "@/shared/components/ui/feedback";
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
import { usePaginatedList } from "@/shared/hooks/use-pagination";
import { cn } from "@/shared/lib/utils";

import type { PortfolioPdfTarget } from "./PortfolioPdfDialog";
import { investorSettlementsQuery } from "./queries";
import type { InvestorSettlementStatus } from "./types";
import {
  formatPct,
  formatRupiah,
  investorSettlementStatusLabel,
  isNegative,
  settlementStatusBadgeClass,
} from "./utils";

const PAGE_SIZE = 10;

/** Portofolio akhir investor: hasil bagi hasil tiap investor per proyek. */
export function InvestorSettlementList({
  onOpenSettlement,
  onDownloadPortfolio,
}: Readonly<{
  onOpenSettlement: (settlementId: string) => void;
  onDownloadPortfolio: (target: PortfolioPdfTarget) => void;
}>) {
  const { data: items } = useSuspenseQuery(investorSettlementsQuery);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvestorSettlementStatus | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchQ =
        !q ||
        i.investorName.toLowerCase().includes(q) ||
        i.investorEmail.toLowerCase().includes(q) ||
        i.projectKey.toLowerCase().includes(q);
      const matchStatus = status === "all" || i.status === status;
      return matchQ && matchStatus;
    });
  }, [items, search, status]);

  const { setPage, pageItems, totalPages, currentPage, start } =
    usePaginatedList(filtered, PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-border bg-background shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari investor atau kode proyek…"
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
            setStatus(v as InvestorSettlementStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {(
              Object.keys(investorSettlementStatusLabel) as InvestorSettlementStatus[]
            ).map((s) => (
              <SelectItem key={s} value={s}>
                {investorSettlementStatusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investor</TableHead>
              <TableHead>Proyek</TableHead>
              <TableHead className="text-right">Modal</TableHead>
              <TableHead className="text-right">Bagi Hasil</TableHead>
              <TableHead className="text-right">Kompensasi</TableHead>
              <TableHead className="text-right">Total Diterima</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64">
                  <EmptyStateGeneral
                    title="Belum ada portofolio investor"
                    description="Hasil investor akan muncul di sini setelah settlement proyek dibuat."
                    icon={Wallet}
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((i) => (
                <TableRow key={i.investorSettlementId}>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">
                      {i.investorName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {i.investorEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-foreground">
                      {i.projectKey}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {i.companyName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatRupiah(i.principalAmount)}
                    <div className="text-xs text-muted-foreground">
                      {formatPct(i.modalPortionPct)}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm tabular-nums",
                      isNegative(i.profitShareAmount) && "text-danger",
                    )}
                  >
                    {formatRupiah(i.profitShareAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatRupiah(i.compensationAmount)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm font-semibold tabular-nums",
                      isNegative(i.totalProfit) && "text-danger",
                    )}
                  >
                    {formatRupiah(i.totalProfit)}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(settlementStatusBadgeClass(i.status))}>
                      {investorSettlementStatusLabel[i.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {/* Portofolio akhir hanya tersedia setelah settlement disetujui */}
                    {i.status === "approved" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Unduh portofolio ${i.investorName}`}
                        title="Unduh portofolio akhir (PDF)"
                        onClick={() =>
                          onDownloadPortfolio({
                            settlementId: i.settlementId,
                            investorSettlementId: i.investorSettlementId,
                          })
                        }
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Lihat settlement ${i.projectKey}`}
                      title="Lihat settlement proyek"
                      onClick={() => onOpenSettlement(i.settlementId)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
              {start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            hasil investor
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
  );
}
