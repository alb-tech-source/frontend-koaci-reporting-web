// --- TIPE DATA UTAMA ---
export type ProjectStatus = "open" | "closed" | "target_achieved" | "cancelled";

export interface Project {
  projectId: string;
  projectKey: string;
  companyId: string;
  companyName?: string;

  fundingRequired: number;
  netMarginAmount: number;
  applicantProfitSharePercentage: number;
  applicantProfitShareAmount: number;
  koaciProfitSharePercentage: number;
  koaciProfitShareAmount: number;
  koaciProfitShareBeneficiaryPercentage: number;
  koaciProfitShareBeneficiaryAmount: number;
  investorProfitSharePercentage: number;
  investorProfitShareAmount: number;
  aggregateFundAmount: number;
  disbursementAmount: number;

  disbursementDate: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  beneficiaryRefundDate: string;
  beneficiaryRefundAmount: number;
  beneficiaryRepaymentSourceAccount: string;
  beneficiaryRepaymentDestinationAccount: string;

  urlTransactionFolder: string;
  fundDisbursementOfficialRecord: string;

  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProjectFormValues = Omit<
  Project,
  "projectId" | "companyName" | "createdAt" | "updatedAt"
>;

export interface ProjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus | "all";
  companyId?: string;
}

export interface ProjectListResponse {
  data: {
    items: Project[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  };
}

export interface CompanyOption {
  companyId: string;
  companyName: string;
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  open: "Terbuka",
  closed: "Ditutup",
  target_achieved: "Target Tercapai",
  cancelled: "Dibatalkan",
};

export const projectStatusOptions: ProjectStatus[] = [
  "open",
  "closed",
  "target_achieved",
  "cancelled",
];

// --- API MAPPER ---
export interface ApiProject {
  project_id: string;
  project_key: string;
  company_id: string;
  funding_required: string | number;
  net_margin_amount: string | number;
  applicant_profit_share_percentage: string | number;
  applicant_profit_share_amount: string | number;
  koaci_profit_share_percentage: string | number;
  koaci_profit_share_amount: string | number;
  koaci_profit_share_beneficiary_percentage: string | number;
  koaci_profit_share_beneficiary_amount: string | number;
  investor_profit_share_percentage: string | number;
  investor_profit_share_amount: string | number;
  aggregate_fund_amount: string | number;
  disbursement_amount: string | number;
  disbursement_date: string | null;
  source_account_number: string;
  destination_account_number: string;
  beneficiary_refund_date: string | null;
  beneficiary_refund_amount: string | number;
  beneficiary_repayment_source_account: string;
  beneficiary_repayment_destination_account: string;
  url_transaction_folder: string;
  fund_disbursement_official_record: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  company?: {
    company_name: string;
  };
}

export function mapApiProject(apiData: ApiProject): Project {
  return {
    projectId: apiData.project_id,
    projectKey: apiData.project_key,
    companyId: apiData.company_id,
    companyName: apiData.company?.company_name || "-",
    fundingRequired: Number(apiData.funding_required) || 0,
    netMarginAmount: Number(apiData.net_margin_amount) || 0,
    applicantProfitSharePercentage:
      Number(apiData.applicant_profit_share_percentage) || 0,
    applicantProfitShareAmount:
      Number(apiData.applicant_profit_share_amount) || 0,
    koaciProfitSharePercentage:
      Number(apiData.koaci_profit_share_percentage) || 0,
    koaciProfitShareAmount: Number(apiData.koaci_profit_share_amount) || 0,
    koaciProfitShareBeneficiaryPercentage:
      Number(apiData.koaci_profit_share_beneficiary_percentage) || 0,
    koaciProfitShareBeneficiaryAmount:
      Number(apiData.koaci_profit_share_beneficiary_amount) || 0,
    investorProfitSharePercentage:
      Number(apiData.investor_profit_share_percentage) || 0,
    investorProfitShareAmount:
      Number(apiData.investor_profit_share_amount) || 0,
    aggregateFundAmount: Number(apiData.aggregate_fund_amount) || 0,
    disbursementAmount: Number(apiData.disbursement_amount) || 0,
    disbursementDate: apiData.disbursement_date || "",
    sourceAccountNumber: apiData.source_account_number || "",
    destinationAccountNumber: apiData.destination_account_number || "",
    beneficiaryRefundDate: apiData.beneficiary_refund_date || "",
    beneficiaryRefundAmount: Number(apiData.beneficiary_refund_amount) || 0,
    beneficiaryRepaymentSourceAccount:
      apiData.beneficiary_repayment_source_account || "",
    beneficiaryRepaymentDestinationAccount:
      apiData.beneficiary_repayment_destination_account || "",
    urlTransactionFolder: apiData.url_transaction_folder || "",
    fundDisbursementOfficialRecord:
      apiData.fund_disbursement_official_record || "",
    status: apiData.status,
    createdAt: apiData.createdAt,
    updatedAt: apiData.updatedAt,
  };
}

export function mapToApiProjectPayload(values: ProjectFormValues) {
  // Helper: field hanya disertakan jika benar-benar terisi (bukan null/undefined/kosong)
  const hasText = (v?: string | null) => (v ?? "").trim() !== "";
  const hasAmount = (v?: number | null) => (v ?? 0) > 0;

  return {
    // Field wajib (divalidasi form) — paksa huruf kecil dan buang simbol dilarang
    project_key: values.projectKey.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
    company_id: values.companyId,
    ...(hasAmount(values.fundingRequired)
      ? { funding_required: values.fundingRequired }
      : {}),
    ...(hasAmount(values.netMarginAmount)
      ? { net_margin_amount: values.netMarginAmount }
      : {}),
    ...(hasAmount(values.applicantProfitSharePercentage)
      ? {
          applicant_profit_share_percentage:
            values.applicantProfitSharePercentage,
        }
      : {}),
    ...(hasAmount(values.applicantProfitShareAmount)
      ? { applicant_profit_share_amount: values.applicantProfitShareAmount }
      : {}),
    ...(hasAmount(values.koaciProfitSharePercentage)
      ? { koaci_profit_share_percentage: values.koaciProfitSharePercentage }
      : {}),
    ...(hasAmount(values.koaciProfitShareAmount)
      ? { koaci_profit_share_amount: values.koaciProfitShareAmount }
      : {}),
    ...(hasAmount(values.koaciProfitShareBeneficiaryPercentage)
      ? {
          koaci_profit_share_beneficiary_percentage:
            values.koaciProfitShareBeneficiaryPercentage,
        }
      : {}),
    ...(hasAmount(values.koaciProfitShareBeneficiaryAmount)
      ? {
          koaci_profit_share_beneficiary_amount:
            values.koaciProfitShareBeneficiaryAmount,
        }
      : {}),
    ...(hasAmount(values.investorProfitSharePercentage)
      ? {
          investor_profit_share_percentage:
            values.investorProfitSharePercentage,
        }
      : {}),
    ...(hasAmount(values.investorProfitShareAmount)
      ? { investor_profit_share_amount: values.investorProfitShareAmount }
      : {}),
    ...(hasAmount(values.aggregateFundAmount)
      ? { aggregate_fund_amount: values.aggregateFundAmount }
      : {}),
    ...(hasAmount(values.disbursementAmount)
      ? { disbursement_amount: values.disbursementAmount }
      : {}),
    ...(hasText(values.disbursementDate)
      ? { disbursement_date: values.disbursementDate }
      : {}),
    ...(hasText(values.sourceAccountNumber)
      ? { source_account_number: values.sourceAccountNumber }
      : {}),
    ...(hasText(values.destinationAccountNumber)
      ? { destination_account_number: values.destinationAccountNumber }
      : {}),
    ...(hasText(values.beneficiaryRefundDate)
      ? { beneficiary_refund_date: values.beneficiaryRefundDate }
      : {}),
    ...(hasAmount(values.beneficiaryRefundAmount)
      ? { beneficiary_refund_amount: values.beneficiaryRefundAmount }
      : {}),
    ...(hasText(values.beneficiaryRepaymentSourceAccount)
      ? {
          beneficiary_repayment_source_account:
            values.beneficiaryRepaymentSourceAccount,
        }
      : {}),
    ...(hasText(values.beneficiaryRepaymentDestinationAccount)
      ? {
          beneficiary_repayment_destination_account:
            values.beneficiaryRepaymentDestinationAccount,
        }
      : {}),
    ...(hasText(values.urlTransactionFolder)
      ? { url_transaction_folder: values.urlTransactionFolder }
      : {}),
    ...(hasText(values.fundDisbursementOfficialRecord)
      ? {
          fund_disbursement_official_record:
            values.fundDisbursementOfficialRecord,
        }
      : {}),
    status: values.status,
  };
}
