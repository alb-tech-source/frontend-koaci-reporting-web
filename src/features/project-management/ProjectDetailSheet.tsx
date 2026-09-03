import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";

import type { Project } from "./types";
import { projectStatusLabel } from "./types";
import {
  formatDateID,
  formatIDR,
  fundingProgress,
  projectStatusBadgeClass,
} from "./utils";

interface ProjectDetailSheetProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailSheet({
  project,
  open,
  onOpenChange,
}: Readonly<ProjectDetailSheetProps>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        {project ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-mono text-lg">
                {project.projectKey}
              </SheetTitle>
              <SheetDescription>
                {project.companyName ?? project.companyId}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <Section title="Info Dasar">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project Key" value={project.projectKey} mono />
                  <Field
                    label="Perusahaan"
                    value={project.companyName ?? project.companyId}
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      className={cn(projectStatusBadgeClass[project.status])}
                    >
                      {projectStatusLabel[project.status]}
                    </Badge>
                  </div>
                  <Field
                    label="Dibuat"
                    value={formatDateID(project.createdAt)}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Progres pendanaan
                    </span>
                    <span className="font-medium text-foreground">
                      {fundingProgress(
                        project.aggregateFundAmount,
                        project.fundingRequired,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={fundingProgress(
                      project.aggregateFundAmount,
                      project.fundingRequired,
                    )}
                    className="h-2"
                  />
                </div>
              </Section>

              <Section title="Struktur Keuangan">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatBox
                    label="Kebutuhan Dana"
                    value={formatIDR(project.fundingRequired)}
                  />
                  <StatBox
                    label="Margin Bersih"
                    value={formatIDR(project.netMarginAmount)}
                  />
                  <StatBox
                    label="Bagi Hasil Pebisnis"
                    value={formatIDR(project.applicantProfitShareAmount)}
                    hint={`${project.applicantProfitSharePercentage}%`}
                  />
                  <StatBox
                    label="Bagi Hasil Koaci"
                    value={formatIDR(project.koaciProfitShareAmount)}
                    hint={`${project.koaciProfitSharePercentage}%`}
                  />
                  <StatBox
                    label="Bagi Hasil Koaci (Beneficiary)"
                    value={formatIDR(
                      project.koaciProfitShareBeneficiaryAmount,
                    )}
                    hint={`${project.koaciProfitShareBeneficiaryPercentage}%`}
                  />
                  <StatBox
                    label="Bagi Hasil Investor"
                    value={formatIDR(project.investorProfitShareAmount)}
                    hint={`${project.investorProfitSharePercentage}%`}
                  />
                  <StatBox
                    label="Dana Terkumpul"
                    value={formatIDR(project.aggregateFundAmount)}
                  />
                  <StatBox
                    label="Dana Disalurkan"
                    value={formatIDR(project.disbursementAmount)}
                  />
                </div>
              </Section>

              <Section title="Rekening & Tanggal">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Tanggal Penyaluran"
                    value={formatDateID(project.disbursementDate)}
                  />
                  <Field
                    label="Rekening Sumber"
                    value={project.sourceAccountNumber || "-"}
                    mono
                  />
                  <Field
                    label="Rekening Tujuan"
                    value={project.destinationAccountNumber || "-"}
                    mono
                  />
                  <Field
                    label="Tanggal Pengembalian Beneficiary"
                    value={formatDateID(project.beneficiaryRefundDate)}
                  />
                  <Field
                    label="Nominal Pengembalian"
                    value={formatIDR(project.beneficiaryRefundAmount)}
                  />
                  <Field
                    label="Rek. Sumber Pengembalian"
                    value={project.beneficiaryRepaymentSourceAccount || "-"}
                    mono
                  />
                  <Field
                    label="Rek. Tujuan Pengembalian"
                    value={
                      project.beneficiaryRepaymentDestinationAccount || "-"
                    }
                    mono
                  />
                </div>
              </Section>

              <Section title="Referensi">
                <div className="space-y-2">
                  <RefLink
                    label="Link Folder Transaksi"
                    href={project.urlTransactionFolder}
                  />
                  <RefLink
                    label="Berita Acara Penyaluran"
                    href={project.fundDisbursementOfficialRecord}
                  />
                </div>
              </Section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <section className="rounded-2xl border border-border bg-background p-4 shadow-card">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  mono,
}: Readonly<{
  label: string;
  value: string;
  mono?: boolean;
}>) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-medium text-foreground",
          mono && "font-mono",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  hint,
}: Readonly<{
  label: string;
  value: string;
  hint?: string;
}>) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      {hint ? <p className="text-xs text-brand">{hint}</p> : null}
    </div>
  );
}

function RefLink({ label, href }: Readonly<{ label: string; href: string }>) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
      <p className="text-sm text-foreground">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          Buka
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">Belum tersedia</span>
      )}
    </div>
  );
}