import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import type {
  CompanyOption,
  Project,
  ProjectFormValues,
  ProjectStatus,
} from "./types";
import { projectStatusLabel, projectStatusOptions } from "./types";
import { formatIDR } from "./utils";

const emptyValues: ProjectFormValues = {
  projectKey: "",
  companyId: "",
  fundingRequired: 0,
  netMarginAmount: 0,
  applicantProfitSharePercentage: 0,
  applicantProfitShareAmount: 0,
  koaciProfitSharePercentage: 0,
  koaciProfitShareAmount: 0,
  koaciProfitShareBeneficiaryPercentage: 0,
  koaciProfitShareBeneficiaryAmount: 0,
  investorProfitSharePercentage: 0,
  investorProfitShareAmount: 0,
  aggregateFundAmount: 0,
  disbursementAmount: 0,
  disbursementDate: "",
  sourceAccountNumber: "",
  destinationAccountNumber: "",
  beneficiaryRefundDate: "",
  beneficiaryRefundAmount: 0,
  beneficiaryRepaymentSourceAccount: "",
  beneficiaryRepaymentDestinationAccount: "",
  urlTransactionFolder: "",
  fundDisbursementOfficialRecord: "",
  status: "open",
};

function toValues(project: Project): ProjectFormValues {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projectId, companyName, createdAt, updatedAt, ...rest } = project;
  return rest;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialProject?: Project | null;
  companies: CompanyOption[];
  onSubmit: (values: ProjectFormValues) => void;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  initialProject,
  companies,
  onSubmit,
}: Readonly<ProjectFormDialogProps>) {
  const [values, setValues] = useState<ProjectFormValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(
      mode === "edit" && initialProject
        ? toValues(initialProject)
        : emptyValues,
    );
  }, [open, mode, initialProject]);

  const set = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const summary = useMemo(
    () => ({
      total: values.aggregateFundAmount,
      investorShare: values.investorProfitSharePercentage,
    }),
    [values.aggregateFundAmount, values.investorProfitSharePercentage],
  );

  const handleSubmit = () => {
    if (!values.projectKey.trim()) {
      setError("Kode proyek wajib diisi.");
      return;
    }
    if (!values.companyId) {
      setError("Perusahaan wajib dipilih.");
      return;
    }
    if (values.fundingRequired <= 0) {
      setError("Kebutuhan dana harus lebih dari 0.");
      return;
    }
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border p-6 pb-4 text-left">
          <DialogTitle>
            {mode === "edit" ? "Edit Proyek" : "Tambah Proyek"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi data proyek pembiayaan sesuai dokumen akad.
          </DialogDescription>
          <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Total Dana: {formatIDR(summary.total)}
            </span>
            <span className="mx-2">|</span>
            <span className="font-medium text-foreground">
              Bagi Hasil Investor: {summary.investorShare}%
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="dasar">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="dasar">Info Dasar</TabsTrigger>
              <TabsTrigger value="keuangan">Keuangan</TabsTrigger>
              <TabsTrigger value="rekening">Rekening</TabsTrigger>
              <TabsTrigger value="referensi">Referensi</TabsTrigger>
            </TabsList>

            <TabsContent value="dasar" className="mt-4 space-y-4">
              <Row label="Kode Proyek *" htmlFor="projectKey">
                <Input
                  id="projectKey"
                  value={values.projectKey}
                  placeholder="ksi-2026-001"
                  className="font-mono"
                  onChange={(e) => 
                    set("projectKey", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
                  }
                />
              </Row>
              <Row label="Perusahaan *">
                <Select
                  value={values.companyId}
                  onValueChange={(v) => set("companyId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih perusahaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.companyId} value={c.companyId}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Status">
                <Select
                  value={values.status}
                  onValueChange={(v) => set("status", v as ProjectStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {projectStatusLabel[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            </TabsContent>

            <TabsContent value="keuangan" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Kebutuhan Dana *"
                  value={values.fundingRequired}
                  onChange={(v) => set("fundingRequired", v)}
                />
                <NumberField
                  label="Margin Bersih"
                  value={values.netMarginAmount}
                  onChange={(v) => set("netMarginAmount", v)}
                />
                <NumberField
                  label="Bagi Hasil Pebisnis (%)"
                  value={values.applicantProfitSharePercentage}
                  onChange={(v) => set("applicantProfitSharePercentage", v)}
                />
                <NumberField
                  label="Bagi Hasil Pebisnis (Rp)"
                  value={values.applicantProfitShareAmount}
                  onChange={(v) => set("applicantProfitShareAmount", v)}
                />
                <NumberField
                  label="Bagi Hasil Koaci (%)"
                  value={values.koaciProfitSharePercentage}
                  onChange={(v) => set("koaciProfitSharePercentage", v)}
                />
                <NumberField
                  label="Bagi Hasil Koaci (Rp)"
                  value={values.koaciProfitShareAmount}
                  onChange={(v) => set("koaciProfitShareAmount", v)}
                />
                <NumberField
                  label="Bagi Hasil Beneficiary (%)"
                  value={values.koaciProfitShareBeneficiaryPercentage}
                  onChange={(v) =>
                    set("koaciProfitShareBeneficiaryPercentage", v)
                  }
                />
                <NumberField
                  label="Bagi Hasil Beneficiary (Rp)"
                  value={values.koaciProfitShareBeneficiaryAmount}
                  onChange={(v) => set("koaciProfitShareBeneficiaryAmount", v)}
                />
                <NumberField
                  label="Bagi Hasil Investor (%)"
                  value={values.investorProfitSharePercentage}
                  onChange={(v) => set("investorProfitSharePercentage", v)}
                />
                <NumberField
                  label="Bagi Hasil Investor (Rp)"
                  value={values.investorProfitShareAmount}
                  onChange={(v) => set("investorProfitShareAmount", v)}
                />
                <NumberField
                  label="Dana Terkumpul"
                  value={values.aggregateFundAmount}
                  onChange={(v) => set("aggregateFundAmount", v)}
                />
                <NumberField
                  label="Dana Disalurkan"
                  value={values.disbursementAmount}
                  onChange={(v) => set("disbursementAmount", v)}
                />
              </div>
            </TabsContent>

            <TabsContent value="rekening" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Row label="Tanggal Penyaluran">
                  <Input
                    type="date"
                    value={values.disbursementDate}
                    onChange={(e) => set("disbursementDate", e.target.value)}
                  />
                </Row>
                <Row label="Rekening Sumber">
                  <Input
                    inputMode="numeric"
                    value={values.sourceAccountNumber}
                    onChange={(e) =>
                      set("sourceAccountNumber", e.target.value)
                    }
                  />
                </Row>
                <Row label="Rekening Tujuan">
                  <Input
                    inputMode="numeric"
                    value={values.destinationAccountNumber}
                    onChange={(e) =>
                      set("destinationAccountNumber", e.target.value)
                    }
                  />
                </Row>
                <Row label="Tanggal Pengembalian Beneficiary">
                  <Input
                    type="date"
                    value={values.beneficiaryRefundDate}
                    onChange={(e) =>
                      set("beneficiaryRefundDate", e.target.value)
                    }
                  />
                </Row>
                <NumberField
                  label="Nominal Pengembalian"
                  value={values.beneficiaryRefundAmount}
                  onChange={(v) => set("beneficiaryRefundAmount", v)}
                />
                <Row label="Rek. Sumber Pengembalian">
                  <Input
                    inputMode="numeric"
                    value={values.beneficiaryRepaymentSourceAccount}
                    onChange={(e) =>
                      set("beneficiaryRepaymentSourceAccount", e.target.value)
                    }
                  />
                </Row>
                <Row label="Rek. Tujuan Pengembalian">
                  <Input
                    inputMode="numeric"
                    value={values.beneficiaryRepaymentDestinationAccount}
                    onChange={(e) =>
                      set(
                        "beneficiaryRepaymentDestinationAccount",
                        e.target.value,
                      )
                    }
                  />
                </Row>
              </div>
            </TabsContent>

            <TabsContent value="referensi" className="mt-4 space-y-4">
              <Row label="Link Folder Transaksi">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={values.urlTransactionFolder}
                  onChange={(e) => set("urlTransactionFolder", e.target.value)}
                />
              </Row>
              <Row label="Berita Acara Penyaluran">
                <Input
                  type="url"
                  placeholder="https://…"
                  value={values.fundDisbursementOfficialRecord}
                  onChange={(e) =>
                    set("fundDisbursementOfficialRecord", e.target.value)
                  }
                />
              </Row>
            </TabsContent>
          </Tabs>

          {error ? (
            <p className="mt-4 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batalkan
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Proyek"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: Readonly<{
  label: string;
  htmlFor?: string;
  children: ReactNode;
}>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}