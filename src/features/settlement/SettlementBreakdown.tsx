import { AlertTriangle, Info } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { SettlementCalc, SettlementInputs, SettlementWarning } from "./types";
import {
  formatPct,
  formatRupiah,
  isNegative,
  warningTitle,
  warningTone,
} from "./utils";

/** Rincian perhitungan settlement dari hasil backend, disusun seperti alur uang. */
export function SettlementBreakdown({
  data,
}: Readonly<{ data: SettlementInputs & SettlementCalc }>) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Hasil Proyek
        </p>
        <Line label="Nilai penjualan" value={data.salesAmount} />
        <Line label="Total modal" value={data.totalCapital} sign="−" />
        <Line label="Margin kotor" value={data.grossMargin} total />
        <Line
          label="Biaya lain"
          hint={data.otherCostDescription || undefined}
          value={data.otherCost}
          sign="−"
        />
        <Line label="Laba bersih" value={data.netProfitMargin} total strong />
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pembagian Laba Bersih
        </p>
        <Line
          label={`Pemohon (${formatPct(data.applicantSharePct)})`}
          value={data.applicantShareAmount}
        />
        <Line
          label={`Koaci (${formatPct(data.koaciSharePct)})`}
          value={data.koaciShareAmount}
          strong
        />
        <div className="ml-3 border-l-2 border-border pl-3">
          <Line
            label={`Porsi investor (${formatPct(data.investorPortionPct)})`}
            value={data.investorPortionAmount}
          />
          <Line
            label={`Porsi Koaci (${formatPct(data.koaciPortionPct)})`}
            value={data.koaciPortionAmount}
          />
          <Line
            label="Kompensasi investor"
            value={data.compensationTotal}
            sign="−"
          />
          <Line
            label="Laba final Koaci"
            value={data.koaciFinalProfit}
            total
            strong
          />
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  hint,
  value,
  sign,
  total = false,
  strong = false,
}: Readonly<{
  label: string;
  hint?: string;
  value: string;
  sign?: "−";
  total?: boolean;
  strong?: boolean;
}>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 py-1.5 text-sm",
        total && "mt-1 border-t border-dashed border-border pt-2",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-muted-foreground",
            strong && "font-medium text-foreground",
          )}
        >
          {label}
        </p>
        {hint ? (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <p
        className={cn(
          "shrink-0 tabular-nums text-foreground",
          strong && "font-semibold",
          isNegative(value) && "text-danger",
        )}
      >
        {sign ? `${sign} ` : ""}
        {formatRupiah(value)}
      </p>
    </div>
  );
}

export function SettlementWarnings({
  warnings,
}: Readonly<{ warnings: SettlementWarning[] }>) {
  if (warnings.length === 0) return null;

  return (
    <ul className="space-y-2">
      {warnings.map((w) => {
        const danger = warningTone[w.code] === "danger";
        return (
          <li
            key={w.code}
            className={cn(
              "flex gap-2.5 rounded-xl border p-3 text-sm",
              danger
                ? "border-danger/30 bg-danger/5"
                : "border-warning/30 bg-warning/5",
            )}
          >
            {danger ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            )}
            <div className="min-w-0">
              <p
                className={cn(
                  "font-medium",
                  danger ? "text-danger" : "text-warning",
                )}
              >
                {warningTitle[w.code] ?? w.code}
              </p>
              <p className="text-xs text-muted-foreground">{w.message}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
