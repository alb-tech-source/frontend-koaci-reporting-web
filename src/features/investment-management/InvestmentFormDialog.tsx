import { useState } from "react";
import { Loader2 } from "lucide-react";

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

import type {
  InvestmentFormValues,
  InvestmentInvestorOption,
  InvestmentProjectOption,
  PaymentMethod,
  ProjectInvestment,
} from "./types";
import { paymentMethodLabel } from "./utils";
import { formatIDR } from "@/shared/lib/format"; // ✅ Global format

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initialValue?: ProjectInvestment | null;
  onSubmit: (values: InvestmentFormValues) => void;
  isSubmitting?: boolean;
  projectOptions: InvestmentProjectOption[];
  investorOptions: InvestmentInvestorOption[];
}

const emptyValues: InvestmentFormValues = {
  project_id: "",
  investor_id: "",
  amount: 0,
  total_package: 1,
  source_account_transaction: "",
  account_reference: "",
  receipt_number: "",
  payment_method: "transfer",
  destination_account_number: "",
};

export function InvestmentFormDialog({
  open,
  onOpenChange,
  mode,
  initialValue,
  onSubmit,
  isSubmitting,
  projectOptions,
  investorOptions,
}: Readonly<Props>) {
  const [values, setValues] = useState<InvestmentFormValues>(emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form saat dialog dibuka / target berubah — pola reset-saat-render (tanpa effect)
  const resetKey = open ? `${mode}:${initialValue?.projectInvestmentId ?? "baru"}` : "tutup";
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setErrors({});
    setValues(mode === "edit" && initialValue
      ? {
          project_id: initialValue.projectId,
          investor_id: initialValue.investorId,
          amount: initialValue.amount,
          total_package: initialValue.totalPackage,
          source_account_transaction: initialValue.sourceAccountTransaction ?? "",
          account_reference: initialValue.accountReference ?? "",
          receipt_number: initialValue.receiptNumber ?? "",
          payment_method: initialValue.paymentMethod,
          destination_account_number: initialValue.destinationAccountNumber ?? "",
        }
      : emptyValues);
  }

  const set = <K extends keyof InvestmentFormValues>(
    key: K,
    value: InvestmentFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const next: Record<string, string> = {};
    if (!values.project_id) next.project_id = "Proyek wajib dipilih.";
    if (!values.investor_id) next.investor_id = "Investor wajib dipilih.";
    if (values.amount <= 0) next.amount = "Nominal harus lebih dari 0.";
    if (!Number.isInteger(values.total_package) || values.total_package <= 0)
      next.total_package = "Jumlah paket harus bilangan bulat > 0.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(values);
  };

  let submitButtonLabel =
    mode === "edit" ? "Simpan Perubahan" : "Simpan Investasi";
  if (isSubmitting) submitButtonLabel = "Menyimpan...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border p-6 text-left">
          <DialogTitle>
            {mode === "edit" ? "Edit Investasi" : "Tambah Investasi"}
          </DialogTitle>
          <DialogDescription>
            Catat transaksi investasi investor pada proyek pembiayaan.
          </DialogDescription>
          <p className="mt-2 text-xs text-muted-foreground">
            Nominal:{" "}
            <span className="font-medium text-foreground">
              {formatIDR(values.amount)}
            </span>{" "}
            · Paket:{" "}
            <span className="font-medium text-foreground">
              {values.total_package || 0}
            </span>
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Proyek *" error={errors.project_id}>
              <Select
                value={values.project_id}
                onValueChange={(v) => set("project_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih proyek" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.projectId} value={p.projectId}>
                      {p.projectKey}{" "}
                      {p.companyName ? ` — ${p.companyName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Investor *" error={errors.investor_id}>
              <Select
                value={values.investor_id}
                onValueChange={(v) => set("investor_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih investor" />
                </SelectTrigger>
                <SelectContent>
                  {investorOptions.map((i) => (
                    <SelectItem key={i.investorId} value={i.investorId}>
                      {i.name} — {i.nik}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Nominal Investasi (Rp) *" error={errors.amount}>
              <Input
                type="number"
                min={0}
                value={values.amount || ""}
                onChange={(e) => set("amount", Number(e.target.value))}
                placeholder="100000000"
              />
            </Field>

            <Field label="Jumlah Paket *" error={errors.total_package}>
              <Input
                type="number"
                min={1}
                step={1}
                value={values.total_package || ""}
                onChange={(e) => set("total_package", Number(e.target.value))}
                placeholder="1"
              />
            </Field>

            <Field label="Metode Pembayaran *">
              <Select
                value={values.payment_method}
                onValueChange={(v) => set("payment_method", v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["transfer", "cash"] as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {paymentMethodLabel[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Rekening Tujuan">
              <Input
                value={values.destination_account_number ?? ""}
                onChange={(e) =>
                  set("destination_account_number", e.target.value)
                }
                placeholder="8820011223344"
              />
            </Field>
            <Field label="Rekening Sumber Transaksi">
              <Input
                value={values.source_account_transaction ?? ""}
                onChange={(e) =>
                  set("source_account_transaction", e.target.value)
                }
                placeholder="1200987654321"
              />
            </Field>
            <Field label="Referensi Rekening">
              <Input
                value={values.account_reference ?? ""}
                onChange={(e) => set("account_reference", e.target.value)}
                placeholder="REF-KSI-0011"
              />
            </Field>
            <Field label="Nomor Kwitansi">
              <Input
                value={values.receipt_number ?? ""}
                onChange={(e) => set("receipt_number", e.target.value)}
                placeholder="KWT/2026/0011"
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="border-t border-border p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batalkan
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submitButtonLabel}
              </>
            ) : (
              submitButtonLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
