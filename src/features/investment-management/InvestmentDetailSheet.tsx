import type { ReactNode } from "react";

import { Badge } from "@/shared/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";

import { ReceiptPanel } from "./ReceiptPanel";
import type { ProjectInvestment } from "./types";
import { investorFullName, paymentMethodLabel } from "./utils";

import { formatDateID, formatIDR } from "@/shared/lib/format";

interface Props {
  investment: ProjectInvestment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadReceipt: (file: File, receiptName: string) => Promise<void>;
  onDeleteReceipt: (receiptDocumentId: string) => Promise<void>;
  onDownloadReceipt: (receiptDocumentId: string) => Promise<void>;
  canManageReceipt?: boolean;
}

export function InvestmentDetailSheet({
  investment,
  open,
  onOpenChange,
  onUploadReceipt,
  onDeleteReceipt,
  onDownloadReceipt,
  canManageReceipt,
}: Readonly<Props>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {investment ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-mono text-lg">
                {investment.project.projectKey}
              </SheetTitle>
              <SheetDescription>
                {investorFullName(investment)} · {investment.investor.user.email || "tanpa email"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <Section title="Ringkasan Investasi">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatBox label="Nominal Investasi" value={formatIDR(investment.amount)} />
                  <StatBox label="Jumlah Paket" value={String(investment.totalPackage)} />
                  <Field
                    label="Metode Pembayaran"
                    value={paymentMethodLabel[investment.paymentMethod] ?? investment.paymentMethod}
                  />
                  <Field label="Nomor Kwitansi" value={investment.receiptNumber || "—"} mono />
                  <Field label="Dibuat" value={formatDateID(investment.createdAt)} />
                  <Field label="Diperbarui" value={formatDateID(investment.updatedAt)} />
                </div>
              </Section>

              <Section title="Rekening Transaksi">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Rekening Sumber (Pengirim)" value={investment.sourceAccountTransaction || "—"} mono />
                  <Field label="Rekening Tujuan (Penerima)" value={investment.destinationAccountNumber || "—"} mono />
                  <Field label="Referensi Transaksi" value={investment.accountReference || "—"} mono />
                </div>
              </Section>

              <Section title="Data Proyek">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Kode Proyek" value={investment.project.projectKey} mono />
                  <Field label="Perusahaan" value={investment.project.company?.companyName ?? "—"} />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status Proyek</p>
                    <Badge className="border-transparent bg-brand/10 text-brand">
                      {investment.project.status.replaceAll('_', " ").toUpperCase()}
                    </Badge>
                  </div>
                  <Field label="Kebutuhan Dana" value={formatIDR(investment.project.fundingRequired)} />
                </div>
              </Section>

              <Section title="Data Investor">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nama Lengkap" value={investorFullName(investment)} />
                  <Field label="Email" value={investment.investor.user.email || "—"} />
                  <Field label="NIK" value={investment.investor.nik || "—"} mono />
                </div>
              </Section>

              <ReceiptPanel
                investment={investment}
                onUpload={onUploadReceipt}
                onDelete={onDeleteReceipt}
                onDownload={onDownloadReceipt}
                canManage={canManageReceipt}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="rounded-2xl border border-border bg-background p-4 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value, mono }: Readonly<{ label: string; value: string; mono?: boolean }>) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium text-foreground${mono ? " font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function StatBox({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}