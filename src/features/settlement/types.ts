/** Angka desimal dari backend, selalu string (mis. "140000000", "0.5", "-60000000"). */
export type DecimalString = string;

export type ProjectSettlementStatus = "review" | "approved" | "rejected";
export type InvestorSettlementStatus = "pending" | "approved" | "rejected";

export type SettlementWarningCode =
  | "CAPITAL_MISMATCH"
  | "NET_LOSS"
  | "NEGATIVE_KOACI_FINAL_PROFIT"
  | "NO_INVESTORS";

export interface SettlementWarning {
  code: SettlementWarningCode;
  message: string;
}

/** Field yang diisi admin. */
export interface SettlementInputs {
  profitModel: string;
  totalCapital: DecimalString;
  salesAmount: DecimalString;
  otherCost: DecimalString;
  otherCostDescription: string;
  applicantSharePct: DecimalString;
  koaciSharePct: DecimalString;
  koaciPortionPct: DecimalString;
  investorPortionPct: DecimalString;
}

/** Field hasil hitung backend — hanya ditampilkan, tidak pernah dikirim. */
export interface SettlementCalc {
  grossMargin: DecimalString;
  netProfitMargin: DecimalString;
  applicantShareAmount: DecimalString;
  koaciShareAmount: DecimalString;
  investorPortionAmount: DecimalString;
  koaciPortionAmount: DecimalString;
  compensationTotal: DecimalString;
  koaciFinalProfit: DecimalString;
}

export interface InvestorSettlementCalc {
  investorId: string;
  principalAmount: DecimalString;
  modalPortionPct: DecimalString;
  profitShareAmount: DecimalString;
  compensationPct: DecimalString;
  compensationAmount: DecimalString;
  totalProfit: DecimalString;
}

export interface SettlementPreview {
  settlement: SettlementInputs & SettlementCalc;
  investors: InvestorSettlementCalc[];
  warnings: SettlementWarning[];
}

export interface InvestorSettlement extends InvestorSettlementCalc {
  investorSettlementId: string;
  settlementId: string;
  investorName: string;
  investorEmail: string;
  projectId: string;
  projectKey: string;
  companyName: string;
  status: InvestorSettlementStatus;
  createdAt: string;
}

export interface ProjectSettlement extends SettlementInputs, SettlementCalc {
  settlementId: string;
  projectId: string;
  projectKey: string;
  companyName: string;
  status: ProjectSettlementStatus;
  investorCount: number;
  createdByName: string;
  approvedByName: string | null;
  createdAt: string;
  updatedAt: string;
  /** Hanya terisi pada detail (GET /:id); kosong pada list. */
  investors: InvestorSettlement[];
}

/** State form (semua angka disimpan sebagai string agar presisi terjaga). */
export interface SettlementFormValues extends SettlementInputs {
  projectId: string;
  /** compensation_pct per investor_id */
  compensations: Record<string, DecimalString>;
}

/** Body untuk POST /preview dan POST / */
export interface SettlementPayload {
  project_id: string;
  profit_model: string;
  total_capital: DecimalString;
  sales_amount: DecimalString;
  other_cost: DecimalString;
  other_cost_description: string;
  applicant_share_pct: DecimalString;
  koaci_share_pct: DecimalString;
  koaci_portion_pct: DecimalString;
  investor_portion_pct: DecimalString;
  investors: { investor_id: string; compensation_pct: DecimalString }[];
}

/** Body untuk PATCH /:id — project_id tidak boleh diubah. */
export type SettlementUpdatePayload = Omit<SettlementPayload, "project_id">;

export interface SettlementMutationResult {
  settlement: ProjectSettlement;
  warnings: SettlementWarning[];
}

/** Investor yang punya investasi di proyek (untuk nama & total modal tercatat). */
export interface ProjectInvestorRef {
  investorId: string;
  name: string;
  email: string;
  totalAmount: number;
}

export interface SettlementProjectOption {
  projectId: string;
  projectKey: string;
  companyName: string;
  statusLabel: string;
}
