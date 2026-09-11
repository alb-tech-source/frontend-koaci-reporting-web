import { AlertTriangle, CalendarDays } from "lucide-react";

import { Progress } from "@/shared/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";

import { MediaPanel } from "./MediaPanel";
import type { ProjectReporting } from "./types";
import { formatDateID, formatIDR, progressIndicatorClass, progressLabel } from "./utils";

interface Props {
  reporting: ProjectReporting | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canUploadMedia?: boolean;
  canDeleteMedia?: boolean;
}

export function ReportingDetailSheet({ reporting, open, onOpenChange, canUploadMedia = false, canDeleteMedia = false }: Readonly<Props>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {reporting ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-mono text-lg">{reporting.projectKey}</SheetTitle>
              <SheetDescription>{reporting.companyName}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <section className="space-y-2 rounded-xl bg-muted/30 p-4">
                <div className="flex items-end justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">Progress Proyek</p>
                  <p className="text-sm font-bold text-foreground">
                    {reporting.estimateProgressPercentage}% <span className="text-muted-foreground font-normal">({progressLabel(reporting.estimateProgressPercentage)})</span>
                  </p>
                </div>
                <Progress value={reporting.estimateProgressPercentage} className={`h-3 ${progressIndicatorClass(reporting.estimateProgressPercentage)}`} />
              </section>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4">
                <InfoItem label="Tanggal Laporan" value={formatDateID(reporting.reportDate)} />
                <InfoItem label="Dana Tersalurkan" value={formatIDR(reporting.fundDisbursed)} />
                <InfoItem label="Dilaporkan Oleh" value={reporting.submittedByName || "—"} />
                <InfoItem label="Terakhir Diperbarui" value={formatDateID(reporting.updatedAt)} />
              </div>

              <TextBlock title="Ringkasan Narasi" text={reporting.narrativeSummary} />
              
              <TextBlock 
                title="Kendala & Hambatan" 
                icon={<AlertTriangle className="h-4 w-4 text-warning" />} 
                text={reporting.issuesBlockers} 
              />
              
              <TextBlock 
                title="Rencana Minggu Depan" 
                icon={<CalendarDays className="h-4 w-4 text-brand" />} 
                text={reporting.nextWeekPlan} 
              />

              <hr className="border-border" />

              <MediaPanel
                reportingId={reporting.reportingId}
                canUpload={canUploadMedia}
                canDelete={canDeleteMedia}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
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

function TextBlock({ title, icon, text }: Readonly<{ title: string; icon?: React.ReactNode; text: string }>) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      <p className="rounded-xl bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
        {text || "—"}
      </p>
    </section>
  );
}