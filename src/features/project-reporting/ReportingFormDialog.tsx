import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

import type { ProjectReporting, ReportingFormValues, ReportingProjectOption, ReportingUpdateValues } from "./types";
import { progressIndicatorClass, progressLabel } from "./utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initialValue?: ProjectReporting | null;
  projectOptions: ReportingProjectOption[];
  onSubmit: (values: ReportingFormValues | ReportingUpdateValues) => void;
  isSubmitting?: boolean;
}

const emptyState = { projectId: "", reportDate: "", progress: "0", summary: "", issues: "", nextPlan: "", fund: "" };

function toDateInput(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ReportingFormDialog({ open, onOpenChange, mode, initialValue, projectOptions, onSubmit, isSubmitting }: Readonly<Props>) {
  const [form, setForm] = useState(emptyState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form saat dialog dibuka / target berubah — pola reset-saat-render (tanpa effect)
  const resetKey = open ? `${mode}:${initialValue?.reportingId ?? "baru"}` : "tutup";
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setErrors({});
    setForm(mode === "edit" && initialValue
      ? {
          projectId: initialValue.projectId,
          reportDate: toDateInput(initialValue.reportDate),
          progress: String(initialValue.estimateProgressPercentage),
          summary: initialValue.narrativeSummary,
          issues: initialValue.issuesBlockers,
          nextPlan: initialValue.nextWeekPlan,
          fund: initialValue.fundDisbursed ? String(initialValue.fundDisbursed) : "",
        }
      : emptyState);
  }

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const pct = Math.min(100, Math.max(0, Number(form.progress) || 0));

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (mode === "create" && !form.projectId) next.projectId = "Proyek wajib dipilih.";
    if (!form.reportDate) next.reportDate = "Tanggal laporan wajib diisi.";
    if (form.summary.trim().length < 20) next.summary = "Ringkasan minimal 20 karakter.";
    if (pct < 0 || pct > 100) next.progress = "Progress harus 0–100.";
    
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const base = {
      report_date: new Date(`${form.reportDate}T00:00:00.000Z`).toISOString(),
      estimate_progress_percentage: pct,
      narative_summary: form.summary.trim(),
      issues_blockers: form.issues.trim() || undefined,
      next_week_plan: form.nextPlan.trim() || undefined,
      fund_disbursed: form.fund ? Number(form.fund) : undefined,
    };

    if (mode === "edit") onSubmit(base as ReportingUpdateValues);
    else onSubmit({ project_id: form.projectId, ...base } as ReportingFormValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border p-6 text-left">
          <DialogTitle>{mode === "edit" ? "Edit Laporan Proyek" : "Tambah Laporan Proyek"}</DialogTitle>
          <DialogDescription>Catat kemajuan mingguan proyek pembiayaan beserta kendalanya.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="space-y-1.5">
            <Label htmlFor="rpt-project">Proyek <span className="text-danger">*</span></Label>
            {mode === "edit" ? (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
                {initialValue?.projectKey} — {initialValue?.companyName}
              </p>
            ) : (
              <Select value={form.projectId} onValueChange={(v) => set("projectId", v)}>
                <SelectTrigger id="rpt-project"><SelectValue placeholder="Pilih proyek" /></SelectTrigger>
                <SelectContent>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.projectId} value={p.projectId}>{p.projectKey} — {p.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.projectId && <p className="text-xs text-danger">{errors.projectId}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rpt-date">Tanggal Laporan <span className="text-danger">*</span></Label>
              <Input id="rpt-date" type="date" value={form.reportDate} onChange={(e) => set("reportDate", e.target.value)} />
              {errors.reportDate && <p className="text-xs text-danger">{errors.reportDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rpt-fund">Dana Tersalurkan (Rp)</Label>
              <Input id="rpt-fund" type="number" min={0} value={form.fund} onChange={(e) => set("fund", e.target.value)} placeholder="150000000" />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border p-4 bg-muted/20">
            <Label htmlFor="rpt-progress">Estimasi Progress (%) <span className="text-danger">*</span></Label>
            <div className="flex items-center gap-4">
              <Input id="rpt-progress" type="number" min={0} max={100} value={form.progress} onChange={(e) => set("progress", e.target.value)} className="w-24 text-center font-mono" />
              <div className="flex-1 space-y-1.5">
                <Progress value={pct} className={`h-2.5 ${progressIndicatorClass(pct)}`} />
                <p className="text-xs font-medium text-muted-foreground">{progressLabel(pct)}</p>
              </div>
            </div>
            {errors.progress && <p className="text-xs text-danger">{errors.progress}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-summary">Ringkasan Narasi <span className="text-danger">*</span></Label>
            <Textarea id="rpt-summary" rows={4} value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Jelaskan kemajuan proyek pada periode ini (min. 20 karakter)…" />
            {errors.summary && <p className="text-xs text-danger">{errors.summary}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-issues">Kendala & Hambatan</Label>
            <Textarea id="rpt-issues" rows={3} value={form.issues} onChange={(e) => set("issues", e.target.value)} placeholder="Apakah ada cuaca buruk atau masalah material?" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpt-plan">Rencana Minggu Depan</Label>
            <Textarea id="rpt-plan" rows={3} value={form.nextPlan} onChange={(e) => set("nextPlan", e.target.value)} placeholder="Apa target pekerjaan selanjutnya?" />
          </div>
        </div>

        <DialogFooter className="border-t border-border p-6">
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Batalkan</Button>
          <Button variant="primary" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Laporan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}