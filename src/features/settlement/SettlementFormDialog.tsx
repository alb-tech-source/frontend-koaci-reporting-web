import { useQuery } from "@tanstack/react-query";
import { Calculator, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

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
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
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

import { toSettlementPayload } from "./api";
import {
  projectInvestorsQuery,
  settlementDetailQuery,
  useSettlementPreview,
} from "./queries";
import { SettlementBreakdown, SettlementWarnings } from "./SettlementBreakdown";
import type {
  ProjectSettlement,
  SettlementFormValues,
  SettlementPayload,
  SettlementProjectOption,
} from "./types";
import {
  complementPct,
  formatPct,
  formatRupiah,
  isNegative,
  profitModelOptions,
  readableApiErrors,
  sanitizeDecimal,
  settlementStatusLabel,
  validateSettlementForm,
  type SettlementFieldKey,
} from "./utils";

const emptyValues: SettlementFormValues = {
  projectId: "",
  profitModel: "",
  totalCapital: "",
  salesAmount: "",
  otherCost: "",
  otherCostDescription: "",
  applicantSharePct: "",
  koaciSharePct: "",
  koaciPortionPct: "",
  investorPortionPct: "",
  compensations: {},
};

function toValues(settlement: ProjectSettlement): SettlementFormValues {
  return {
    projectId: settlement.projectId,
    profitModel: settlement.profitModel,
    totalCapital: settlement.totalCapital,
    salesAmount: settlement.salesAmount,
    otherCost: settlement.otherCost === "0" ? "" : settlement.otherCost,
    otherCostDescription: settlement.otherCostDescription,
    applicantSharePct: settlement.applicantSharePct,
    koaciSharePct: settlement.koaciSharePct,
    koaciPortionPct: settlement.koaciPortionPct,
    investorPortionPct: settlement.investorPortionPct,
    compensations: Object.fromEntries(
      settlement.investors.map((i) => [
        i.investorId,
        i.compensationPct === "0" ? "" : i.compensationPct,
      ]),
    ),
  };
}

const STEPS: { value: string; label: string; fields: SettlementFieldKey[] }[] =
  [
    {
      value: "hasil",
      label: "1. Hasil Proyek",
      fields: [
        "projectId",
        "profitModel",
        "totalCapital",
        "salesAmount",
        "otherCost",
        "otherCostDescription",
      ],
    },
    {
      value: "pembagian",
      label: "2. Pembagian",
      fields: [
        "applicantSharePct",
        "koaciSharePct",
        "koaciPortionPct",
        "investorPortionPct",
      ],
    },
    { value: "investor", label: "3. Investor", fields: [] },
  ];

interface SettlementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Wajib pada mode edit. */
  settlementId?: string | null;
  /** Proyek yang belum punya settlement (untuk mode create). */
  projectOptions: SettlementProjectOption[];
  /** Proyek yang langsung terpilih saat create (mis. dari halaman Proyek). */
  initialProjectId?: string | null;
  onSubmit: (payload: SettlementPayload) => void;
  isSubmitting?: boolean;
}

export function SettlementFormDialog({
  open,
  onOpenChange,
  mode,
  settlementId,
  projectOptions,
  initialProjectId,
  onSubmit,
  isSubmitting = false,
}: Readonly<SettlementFormDialogProps>) {
  const isEdit = mode === "edit";
  const { data: existing } = useQuery({
    ...settlementDetailQuery(settlementId ?? ""),
    enabled: open && isEdit && !!settlementId,
  });

  const [values, setValues] = useState<SettlementFormValues>(emptyValues);
  const [step, setStep] = useState(STEPS[0].value);
  const [showErrors, setShowErrors] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset form saat dialog dibuka / target berubah / data edit selesai dimuat — pola reset-saat-render
  const resetKey = open
    ? `${mode}:${settlementId ?? initialProjectId ?? "baru"}:${isEdit && !existing ? "memuat" : "siap"}`
    : "tutup";
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setStep(STEPS[0].value);
    setShowErrors(false);
    setConfirmOpen(false);
    setValues(
      isEdit && existing
        ? toValues(existing)
        : { ...emptyValues, projectId: initialProjectId ?? "" },
    );
  }

  const set = <K extends keyof SettlementFormValues>(
    key: K,
    value: SettlementFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  // Pasangan persen saling melengkapi: isi satu, pasangannya terisi otomatis (60 → 40)
  const setPctPair = (
    key: SettlementFieldKey,
    pairKey: SettlementFieldKey,
    value: string,
  ) =>
    setValues((prev) => ({
      ...prev,
      [key]: value,
      [pairKey]: complementPct(value) || prev[pairKey],
    }));

  const {
    data: projectInvestors,
    isLoading: investorsLoading,
    error: investorsError,
  } = useQuery({
    ...projectInvestorsQuery(values.projectId),
    enabled: open && !!values.projectId,
  });

  const errors = useMemo(() => validateSettlementForm(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const payload = useMemo(
    () =>
      isValid && projectInvestors
        ? toSettlementPayload(
            values,
            projectInvestors.map((i) => i.investorId),
          )
        : null,
    [isValid, projectInvestors, values],
  );

  const { preview, isReady, isUpToDate, isCalculating, error } =
    useSettlementPreview(open ? payload : null);

  const recordedCapital = (projectInvestors ?? []).reduce(
    (sum, i) => sum + i.totalAmount,
    0,
  );
  const investorRefs = new Map(
    (projectInvestors ?? []).map((i) => [i.investorId, i]),
  );
  // Sumber daftar investor = hasil preview; sebelum preview tersedia pakai data investasi
  const investorRows = preview
    ? preview.investors.map((calc) => ({
        investorId: calc.investorId,
        ref: investorRefs.get(calc.investorId),
        calc,
      }))
    : (projectInvestors ?? []).map((ref) => ({
        investorId: ref.investorId,
        ref,
        calc: undefined,
      }));

  const stepIndex = STEPS.findIndex((s) => s.value === step);
  const isLastStep = stepIndex === STEPS.length - 1;
  const fieldError = (key: SettlementFieldKey) =>
    showErrors ? errors[key] : undefined;
  const stepHasError = (index: number) =>
    showErrors && STEPS[index].fields.some((f) => errors[f]);

  const handleNext = () => {
    if (STEPS[stepIndex].fields.some((f) => errors[f])) {
      setShowErrors(true);
      return;
    }
    setStep(STEPS[stepIndex + 1].value);
  };

  const handleSave = () => {
    if (!isValid) {
      setShowErrors(true);
      const firstInvalid = STEPS.find((s) => s.fields.some((f) => errors[f]));
      if (firstInvalid) setStep(firstInvalid.value);
      return;
    }
    if (!payload || !isUpToDate || !preview) return;
    if (preview.warnings.length > 0) {
      setConfirmOpen(true);
      return;
    }
    onSubmit(payload);
  };

  const editLoading = isEdit && !existing;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !isSubmitting && onOpenChange(o)}
    >
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border p-6 pb-4 text-left">
          <DialogTitle>
            {isEdit ? "Edit Settlement" : "Buat Settlement Proyek"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Setelah disimpan, settlement kembali berstatus Menunggu Approval dan perlu disetujui ulang."
              : "Isi hasil akhir proyek. Perhitungan pembagian dilakukan otomatis oleh sistem."}
          </DialogDescription>
          {isEdit && existing?.status === "rejected" ? (
            <p className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
              Settlement ini sebelumnya{" "}
              <span className="font-medium">
                {settlementStatusLabel.rejected.toLowerCase()}
              </span>
              . Perbaiki data lalu simpan untuk mengajukan ulang.
            </p>
          ) : null}
        </DialogHeader>

        {editLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="grid flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden">
            <div className="p-6 lg:overflow-y-auto">
              <Tabs value={step} onValueChange={setStep}>
                <TabsList className="grid w-full grid-cols-3">
                  {STEPS.map((s, index) => (
                    <TabsTrigger key={s.value} value={s.value}>
                      <span className={cn(stepHasError(index) && "text-danger")}>
                        {s.label}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* LANGKAH 1 — HASIL PROYEK */}
                <TabsContent value="hasil" className="mt-4 space-y-4">
                  <Field label="Proyek *" error={fieldError("projectId")}>
                    {isEdit ? (
                      <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                        <span className="font-mono font-medium">
                          {existing?.projectKey}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {existing?.companyName}
                        </span>
                      </div>
                    ) : (
                      <Select
                        value={values.projectId}
                        onValueChange={(v) =>
                          setValues((prev) => ({
                            ...prev,
                            projectId: v,
                            compensations: {},
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih proyek yang akan diselesaikan" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Semua proyek sudah memiliki settlement.
                            </div>
                          ) : (
                            projectOptions.map((p) => (
                              <SelectItem key={p.projectId} value={p.projectId}>
                                <span className="font-mono">{p.projectKey}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {p.companyName} · {p.statusLabel}
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>

                  <Field
                    label="Model Keuntungan *"
                    error={fieldError("profitModel")}
                  >
                    <Select
                      value={values.profitModel}
                      onValueChange={(v) => set("profitModel", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih model keuntungan" />
                      </SelectTrigger>
                      <SelectContent>
                        {profitModelOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                        {/* Pertahankan nilai lama yang tidak ada di daftar opsi */}
                        {values.profitModel &&
                        !profitModelOptions.some(
                          (o) => o.value === values.profitModel,
                        ) ? (
                          <SelectItem value={values.profitModel}>
                            {values.profitModel}
                          </SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Total Modal *"
                      error={fieldError("totalCapital")}
                      hint={
                        values.projectId && !investorsLoading ? (
                          <span>
                            Total investasi tercatat:{" "}
                            <span className="font-medium text-foreground">
                              {formatRupiah(recordedCapital)}
                            </span>
                            {recordedCapital > 0 &&
                            Number(values.totalCapital) !== recordedCapital ? (
                              <button
                                type="button"
                                className="ml-1.5 font-medium text-brand hover:underline"
                                onClick={() =>
                                  set("totalCapital", String(recordedCapital))
                                }
                              >
                                Gunakan
                              </button>
                            ) : null}
                          </span>
                        ) : undefined
                      }
                    >
                      <DecimalInput
                        prefix="Rp"
                        maxDp={2}
                        value={values.totalCapital}
                        onChange={(v) => set("totalCapital", v)}
                      />
                    </Field>
                    <Field
                      label="Nilai Penjualan *"
                      error={fieldError("salesAmount")}
                    >
                      <DecimalInput
                        prefix="Rp"
                        maxDp={2}
                        value={values.salesAmount}
                        onChange={(v) => set("salesAmount", v)}
                      />
                    </Field>
                    <Field label="Biaya Lain" error={fieldError("otherCost")}>
                      <DecimalInput
                        prefix="Rp"
                        maxDp={2}
                        value={values.otherCost}
                        placeholder="0"
                        onChange={(v) => set("otherCost", v)}
                      />
                    </Field>
                    <Field label="Keterangan Biaya Lain">
                      <Input
                        value={values.otherCostDescription}
                        placeholder="mis. Biaya logistik"
                        onChange={(e) =>
                          set("otherCostDescription", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                </TabsContent>

                {/* LANGKAH 2 — PEMBAGIAN */}
                <TabsContent value="pembagian" className="mt-4 space-y-5">
                  <PctPairCard
                    title="Pembagian laba bersih"
                    description="Laba bersih dibagi antara pemohon (pebisnis) dan Koaci. Jumlah keduanya harus 100%."
                    left={{
                      label: "Porsi Pemohon *",
                      value: values.applicantSharePct,
                      error: fieldError("applicantSharePct"),
                      onChange: (v) =>
                        setPctPair("applicantSharePct", "koaciSharePct", v),
                    }}
                    right={{
                      label: "Porsi Koaci *",
                      value: values.koaciSharePct,
                      error: fieldError("koaciSharePct"),
                      onChange: (v) =>
                        setPctPair("koaciSharePct", "applicantSharePct", v),
                    }}
                  />
                  <PctPairCard
                    title="Pembagian bagian Koaci"
                    description="Bagian Koaci dibagi lagi untuk investor dan Koaci. Porsi investor dibagikan ke tiap investor sesuai modal yang disetor."
                    left={{
                      label: "Porsi Investor *",
                      value: values.investorPortionPct,
                      error: fieldError("investorPortionPct"),
                      onChange: (v) =>
                        setPctPair("investorPortionPct", "koaciPortionPct", v),
                    }}
                    right={{
                      label: "Porsi Koaci *",
                      value: values.koaciPortionPct,
                      error: fieldError("koaciPortionPct"),
                      onChange: (v) =>
                        setPctPair("koaciPortionPct", "investorPortionPct", v),
                    }}
                  />
                </TabsContent>

                {/* LANGKAH 3 — INVESTOR & KOMPENSASI */}
                <TabsContent value="investor" className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Daftar investor diambil otomatis dari data investasi proyek.
                    Isi <span className="font-medium text-foreground">kompensasi</span>{" "}
                    (% dari modal) bila ada investor yang mendapat tambahan;
                    kosongkan bila tidak ada.
                  </p>

                  {!values.projectId ? (
                    <EmptyHint text="Pilih proyek terlebih dahulu di langkah 1." />
                  ) : investorsError ? (
                    <EmptyHint
                      text={getErrorMessage(
                        investorsError,
                        "Gagal memuat data investor proyek.",
                      )}
                    />
                  ) : investorsLoading ? (
                    <Skeleton className="h-40 w-full rounded-xl" />
                  ) : investorRows.length === 0 ? (
                    <EmptyHint text="Proyek ini belum memiliki data investasi. Settlement tetap bisa disimpan, tetapi tidak ada bagi hasil untuk investor." />
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Investor</TableHead>
                            <TableHead className="text-right">Modal</TableHead>
                            <TableHead className="w-32">Kompensasi</TableHead>
                            <TableHead className="text-right">
                              Total Diterima
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {investorRows.map(({ investorId, ref, calc }) => (
                            <TableRow key={investorId}>
                              <TableCell>
                                <div className="text-sm font-medium text-foreground">
                                  {ref?.name ?? "Investor"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {calc
                                    ? `Porsi modal ${formatPct(calc.modalPortionPct)}`
                                    : (ref?.email ?? "-")}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm tabular-nums">
                                {formatRupiah(
                                  calc?.principalAmount ?? ref?.totalAmount,
                                )}
                              </TableCell>
                              <TableCell>
                                <DecimalInput
                                  suffix="%"
                                  maxDp={4}
                                  placeholder="0"
                                  className="h-8"
                                  value={values.compensations[investorId] ?? ""}
                                  onChange={(v) =>
                                    set("compensations", {
                                      ...values.compensations,
                                      [investorId]: v,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right text-sm font-medium tabular-nums",
                                  calc && isNegative(calc.totalProfit) && "text-danger",
                                )}
                              >
                                {calc ? formatRupiah(calc.totalProfit) : "—"}
                                {calc && Number(calc.compensationAmount) !== 0 ? (
                                  <div className="text-xs font-normal text-muted-foreground">
                                    termasuk kompensasi{" "}
                                    {formatRupiah(calc.compensationAmount)}
                                  </div>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <PreviewPanel
              notReadyText={
                investorsError
                  ? "Data investor proyek gagal dimuat, sehingga perhitungan belum bisa ditampilkan."
                  : undefined
              }
              isReady={isReady}
              isCalculating={isCalculating}
              error={error}
              preview={preview}
            />
          </div>
        )}

        <DialogFooter className="gap-2 border-t border-border p-4 sm:justify-between">
          <div>
            {stepIndex > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(STEPS[stepIndex - 1].value)}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batalkan
            </Button>
            {isLastStep ? (
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={
                  isSubmitting ||
                  editLoading ||
                  (isValid && (!isUpToDate || !!error))
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                  </>
                ) : isValid && isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghitung...
                  </>
                ) : isEdit ? (
                  "Simpan & Ajukan Ulang"
                ) : (
                  "Simpan & Ajukan Approval"
                )}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext} disabled={editLoading}>
                Lanjut
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ada {preview?.warnings.length ?? 0} peringatan, tetap simpan?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Periksa kembali peringatan berikut. Settlement tetap bisa
                  disimpan dan akan ditinjau oleh BOD.
                </p>
                <SettlementWarnings warnings={preview?.warnings ?? []} />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Periksa Lagi</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (payload) onSubmit(payload);
              }}
            >
              Tetap Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function PreviewPanel({
  notReadyText = "Lengkapi data hasil proyek dan pembagian untuk melihat perhitungan otomatis.",
  isReady,
  isCalculating,
  error,
  preview,
}: Readonly<{
  notReadyText?: string;
  isReady: boolean;
  isCalculating: boolean;
  error: unknown;
  preview: ReturnType<typeof useSettlementPreview>["preview"];
}>) {
  return (
    <aside className="border-t border-border bg-muted/30 p-6 lg:overflow-y-auto lg:border-l lg:border-t-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calculator className="h-4 w-4 text-brand" /> Ringkasan Perhitungan
        </h3>
        {isCalculating ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {!isReady ? (
        <EmptyHint text={notReadyText} />
      ) : error ? (
        <div className="space-y-1 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {readableApiErrors(
            getErrorMessage(error, "Gagal menghitung settlement."),
          ).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : preview ? (
        <div
          className={cn(
            "space-y-4 transition-opacity",
            isCalculating && "opacity-60",
          )}
        >
          <SettlementWarnings warnings={preview.warnings} />
          <SettlementBreakdown data={preview.settlement} />
        </div>
      ) : (
        <Skeleton className="h-72 w-full rounded-xl" />
      )}
    </aside>
  );
}

function PctPairCard({
  title,
  description,
  left,
  right,
}: Readonly<{
  title: string;
  description: string;
  left: PctFieldProps;
  right: PctFieldProps;
}>) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {[left, right].map((f) => (
          <Field key={f.label} label={f.label} error={f.error}>
            <DecimalInput
              suffix="%"
              maxDp={4}
              value={f.value}
              onChange={f.onChange}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

interface PctFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function Field({
  label,
  error,
  hint,
  children,
}: Readonly<{
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Input angka berbasis string (tanpa round-trip Number) dengan prefix Rp / suffix %. */
function DecimalInput({
  value,
  onChange,
  maxDp,
  prefix,
  suffix,
  placeholder,
  className,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  maxDp: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
}>) {
  return (
    <div>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          className={cn(
            "tabular-nums",
            prefix && "pl-9",
            suffix && "pr-8",
            className,
          )}
          onChange={(e) => onChange(sanitizeDecimal(e.target.value, maxDp))}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {/* Bantu baca nominal besar (mis. 500000000 → Rp 500.000.000) */}
      {prefix === "Rp" && value && Number(value) > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRupiah(value)}
        </p>
      ) : null}
    </div>
  );
}

function EmptyHint({ text }: Readonly<{ text: string }>) {
  return (
    <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
