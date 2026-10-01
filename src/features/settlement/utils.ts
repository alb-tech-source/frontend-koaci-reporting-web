import type {
  DecimalString,
  InvestorSettlementStatus,
  ProjectSettlementStatus,
  SettlementFormValues,
  SettlementWarningCode,
} from "./types";

export { formatDateID } from "@/shared/lib/format";

export const settlementStatusLabel: Record<ProjectSettlementStatus, string> = {
  review: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const investorSettlementStatusLabel: Record<
  InvestorSettlementStatus,
  string
> = {
  pending: "Menunggu Approval",
  approved: "Final",
  rejected: "Ditolak",
};

const STATUS_BADGE_CLASS: Record<
  ProjectSettlementStatus | InvestorSettlementStatus,
  string
> = {
  review: "border-transparent bg-warning/15 text-warning",
  pending: "border-transparent bg-warning/15 text-warning",
  approved: "border-transparent bg-success/15 text-success",
  rejected: "border-transparent bg-danger/15 text-danger",
};

export function settlementStatusBadgeClass(
  status: ProjectSettlementStatus | InvestorSettlementStatus,
): string {
  return STATUS_BADGE_CLASS[status];
}

export const isSettlementEditable = (status: ProjectSettlementStatus) =>
  status === "review" || status === "rejected";

export const profitModelOptions = [
  { value: "jual beli", label: "Jual Beli" },
  { value: "bagi hasil pendapatan", label: "Bagi Hasil Pendapatan" },
] as const;

export function profitModelLabel(value: string): string {
  return profitModelOptions.find((o) => o.value === value)?.label ?? value;
}

export const warningTone: Record<SettlementWarningCode, "warning" | "danger"> =
  {
    CAPITAL_MISMATCH: "warning",
    NET_LOSS: "danger",
    NEGATIVE_KOACI_FINAL_PROFIT: "warning",
    NO_INVESTORS: "warning",
  };

export const warningTitle: Record<SettlementWarningCode, string> = {
  CAPITAL_MISMATCH: "Modal tidak sesuai total investasi",
  NET_LOSS: "Proyek merugi",
  NEGATIVE_KOACI_FINAL_PROFIT: "Kompensasi melebihi porsi Koaci",
  NO_INVESTORS: "Belum ada data investasi",
};

// --- FORMAT TAMPILAN (jangan dipakai untuk menghitung nilai yang dikirim) ---

/** Rupiah dengan hingga 2 desimal — nilai settlement bisa memuat sen & negatif. */
export function formatRupiah(value?: DecimalString | number | null): string {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(Number(value))
    .replace("IDR", "Rp")
    .trim();
}

export function formatPct(value?: DecimalString | null): string {
  if (value == null || value === "") return "—";
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(Number(value))}%`;
}

export const isNegative = (value?: DecimalString | null) =>
  Number(value) < 0;

// --- INPUT ANGKA ---

/** Sisakan digit & satu titik desimal, dengan batas jumlah angka di belakang koma. */
export function sanitizeDecimal(raw: string, maxDp: number): string {
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const [intPart = "", ...rest] = normalized.split(".");
  const cleanInt = intPart.replace(/^0+(?=\d)/, "");
  if (rest.length === 0) return cleanInt;
  return `${cleanInt || "0"}.${rest.join("").slice(0, maxDp)}`;
}

// Persen dibandingkan dalam satuan 1/10000 agar bebas error floating point (maks. 4 desimal)
const pctUnits = (v: string) => Math.round(Number(v) * 10_000);

/** Isi otomatis pasangan persen: complementPct("60") -> "40". */
export function complementPct(value: string): string {
  if (value === "" || Number.isNaN(Number(value))) return "";
  const units = pctUnits(value);
  if (units < 0 || units > 1_000_000) return "";
  return String((1_000_000 - units) / 10_000);
}

// --- VALIDASI CLIENT (hanya untuk UX: menentukan kapan preview & simpan boleh jalan) ---

export type SettlementFieldKey = Exclude<
  keyof SettlementFormValues,
  "compensations"
>;

export type SettlementFormErrors = Partial<Record<SettlementFieldKey, string>>;

const isBlank = (v: string) => v.trim() === "";

export function validateSettlementForm(
  values: SettlementFormValues,
): SettlementFormErrors {
  const errors: SettlementFormErrors = {};

  if (!values.projectId) errors.projectId = "Proyek wajib dipilih.";
  if (isBlank(values.profitModel))
    errors.profitModel = "Model keuntungan wajib dipilih.";
  if (isBlank(values.totalCapital) || Number(values.totalCapital) <= 0)
    errors.totalCapital = "Total modal harus lebih dari 0.";
  if (isBlank(values.salesAmount))
    errors.salesAmount = "Nilai penjualan wajib diisi.";

  const pctFields = [
    "applicantSharePct",
    "koaciSharePct",
    "koaciPortionPct",
    "investorPortionPct",
  ] as const;
  for (const key of pctFields) {
    if (isBlank(values[key])) errors[key] = "Wajib diisi.";
    else if (Number(values[key]) > 100) errors[key] = "Maksimal 100%.";
  }

  if (
    !errors.applicantSharePct &&
    !errors.koaciSharePct &&
    pctUnits(values.applicantSharePct) + pctUnits(values.koaciSharePct) !==
      1_000_000
  ) {
    errors.koaciSharePct = "Porsi pemohon + Koaci harus 100%.";
  }
  if (
    !errors.koaciPortionPct &&
    !errors.investorPortionPct &&
    pctUnits(values.koaciPortionPct) + pctUnits(values.investorPortionPct) !==
      1_000_000
  ) {
    errors.investorPortionPct = "Porsi Koaci + investor harus 100%.";
  }

  return errors;
}

// --- ERROR BACKEND ---

const API_FIELD_LABEL: Record<string, string> = {
  project_id: "Proyek",
  profit_model: "Model keuntungan",
  total_capital: "Total modal",
  sales_amount: "Nilai penjualan",
  other_cost: "Biaya lain",
  other_cost_description: "Keterangan biaya",
  applicant_share_pct: "Porsi pemohon",
  koaci_share_pct: "Porsi Koaci",
  koaci_portion_pct: "Porsi Koaci (dari bagian Koaci)",
  investor_portion_pct: "Porsi investor",
  investors: "Investor",
};

/** Ubah pesan "field: pesan, field2: pesan" dari backend menjadi baris yang mudah dibaca. */
export function readableApiErrors(message: string): string[] {
  return message.split(/,\s*(?=[a-z_]+:)/).map((part) => {
    const match = /^([a-z_]+):\s*(.*)$/.exec(part.trim());
    if (!match) return part.trim();
    const [, field, text] = match;
    return `${API_FIELD_LABEL[field] ?? field}: ${text}`;
  });
}
