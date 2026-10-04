import api from "@/shared/lib/axios";
import { fetchAllPages } from "@/shared/lib/fetchAllPages";
import { fetchProjects } from "@/features/project-management/api";
import { projectStatusLabel } from "@/features/project-management/types";
import type {
  InvestorSettlement,
  InvestorSettlementCalc,
  InvestorSettlementStatus,
  ProjectInvestorRef,
  ProjectSettlement,
  ProjectSettlementStatus,
  SettlementCalc,
  SettlementFormValues,
  SettlementInputs,
  SettlementMutationResult,
  SettlementPayload,
  SettlementPreview,
  SettlementProjectOption,
  SettlementUpdatePayload,
  SettlementWarning,
} from "./types";

// Bentuk mentah respons /project-settlements & /investor-settlements
type ApiDecimal = string | number | null | undefined;

interface ApiUserRef {
  firstname?: string | null;
  lastname?: string | null;
  email?: string;
}

interface ApiProjectRef {
  project_id?: string;
  project_key?: string;
  company?: { company_name?: string };
}

interface ApiSettlementFields {
  profit_model?: string;
  total_capital?: ApiDecimal;
  sales_amount?: ApiDecimal;
  other_cost?: ApiDecimal;
  other_cost_description?: string;
  applicant_share_pct?: ApiDecimal;
  koaci_share_pct?: ApiDecimal;
  koaci_portion_pct?: ApiDecimal;
  investor_portion_pct?: ApiDecimal;
  gross_margin?: ApiDecimal;
  net_profit_margin?: ApiDecimal;
  applicant_share_amount?: ApiDecimal;
  koaci_share_amount?: ApiDecimal;
  investor_portion_amount?: ApiDecimal;
  koaci_portion_amount?: ApiDecimal;
  compensation_total?: ApiDecimal;
  koaci_final_profit?: ApiDecimal;
}

interface ApiInvestorCalc {
  investor_id?: string;
  principal_amount?: ApiDecimal;
  modal_portion_pct?: ApiDecimal;
  profit_share_amount?: ApiDecimal;
  compensation_pct?: ApiDecimal;
  compensation_amount?: ApiDecimal;
  total_profit?: ApiDecimal;
}

interface ApiInvestorSettlement extends ApiInvestorCalc {
  investor_settlement_id?: string;
  project_settlement_id?: string;
  status?: string;
  created_at?: string;
  investor?: { investor_id?: string; user?: ApiUserRef };
  projectSettlement?: { project_id?: string; project?: ApiProjectRef };
}

interface ApiProjectSettlement extends ApiSettlementFields {
  project_settlement_id?: string;
  project_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  project?: ApiProjectRef;
  createdBy?: ApiUserRef | null;
  approvedBy?: ApiUserRef | null;
  _count?: { investorSettlement?: number };
  investorSettlement?: ApiInvestorSettlement[];
}

interface ApiProjectInvestmentRow {
  investor_id?: string;
  amount?: ApiDecimal;
  investor?: { investor_id?: string; user?: ApiUserRef };
}

const dec = (v: ApiDecimal): string => (v == null ? "0" : String(v));

function fullName(user?: ApiUserRef | null): string {
  if (!user) return "";
  return (
    `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || user.email || ""
  );
}

function mapInputs(raw: ApiSettlementFields): SettlementInputs {
  return {
    profitModel: raw.profit_model ?? "",
    totalCapital: dec(raw.total_capital),
    salesAmount: dec(raw.sales_amount),
    otherCost: dec(raw.other_cost),
    otherCostDescription: raw.other_cost_description ?? "",
    applicantSharePct: dec(raw.applicant_share_pct),
    koaciSharePct: dec(raw.koaci_share_pct),
    koaciPortionPct: dec(raw.koaci_portion_pct),
    investorPortionPct: dec(raw.investor_portion_pct),
  };
}

function mapCalc(raw: ApiSettlementFields): SettlementCalc {
  return {
    grossMargin: dec(raw.gross_margin),
    netProfitMargin: dec(raw.net_profit_margin),
    applicantShareAmount: dec(raw.applicant_share_amount),
    koaciShareAmount: dec(raw.koaci_share_amount),
    investorPortionAmount: dec(raw.investor_portion_amount),
    koaciPortionAmount: dec(raw.koaci_portion_amount),
    compensationTotal: dec(raw.compensation_total),
    koaciFinalProfit: dec(raw.koaci_final_profit),
  };
}

function mapInvestorCalc(raw: ApiInvestorCalc): InvestorSettlementCalc {
  return {
    investorId: raw.investor_id ?? "",
    principalAmount: dec(raw.principal_amount),
    modalPortionPct: dec(raw.modal_portion_pct),
    profitShareAmount: dec(raw.profit_share_amount),
    compensationPct: dec(raw.compensation_pct),
    compensationAmount: dec(raw.compensation_amount),
    totalProfit: dec(raw.total_profit),
  };
}

function mapInvestorSettlement(
  raw: ApiInvestorSettlement,
  parent?: { projectId: string; projectKey: string; companyName: string },
): InvestorSettlement {
  const project = raw.projectSettlement?.project;
  const user = raw.investor?.user;
  return {
    ...mapInvestorCalc(raw),
    investorSettlementId: raw.investor_settlement_id ?? "",
    settlementId: raw.project_settlement_id ?? "",
    investorName: fullName(user) || "Tanpa Nama",
    investorEmail: user?.email ?? "-",
    projectId:
      parent?.projectId ?? raw.projectSettlement?.project_id ?? "",
    projectKey: parent?.projectKey ?? project?.project_key ?? "Tanpa Kode",
    companyName:
      parent?.companyName ?? project?.company?.company_name ?? "-",
    status: (raw.status ?? "pending") as InvestorSettlementStatus,
    createdAt: raw.created_at ?? "",
  };
}

function mapSettlement(raw: ApiProjectSettlement): ProjectSettlement {
  const projectId = raw.project_id ?? raw.project?.project_id ?? "";
  const projectKey = raw.project?.project_key ?? "Tanpa Kode";
  const companyName = raw.project?.company?.company_name ?? "-";
  const investors = (raw.investorSettlement ?? []).map((row) =>
    mapInvestorSettlement(row, { projectId, projectKey, companyName }),
  );

  return {
    ...mapInputs(raw),
    ...mapCalc(raw),
    settlementId: raw.project_settlement_id ?? "",
    projectId,
    projectKey,
    companyName,
    status: (raw.status ?? "review") as ProjectSettlementStatus,
    investorCount: raw._count?.investorSettlement ?? investors.length,
    createdByName: fullName(raw.createdBy) || "Sistem",
    approvedByName: fullName(raw.approvedBy) || null,
    createdAt: raw.created_at ?? "",
    updatedAt: raw.updated_at ?? "",
    investors,
  };
}

export function toSettlementPayload(
  values: SettlementFormValues,
  investorIds: string[],
): SettlementPayload {
  return {
    project_id: values.projectId,
    profit_model: values.profitModel,
    total_capital: values.totalCapital,
    sales_amount: values.salesAmount,
    other_cost: values.otherCost || "0",
    other_cost_description: values.otherCostDescription.trim(),
    applicant_share_pct: values.applicantSharePct,
    koaci_share_pct: values.koaciSharePct,
    koaci_portion_pct: values.koaciPortionPct,
    investor_portion_pct: values.investorPortionPct,
    // Selalu kirim daftar lengkap: saat edit, `investors` menggantikan seluruh kompensasi
    investors: investorIds.map((id) => ({
      investor_id: id,
      compensation_pct: values.compensations[id] || "0",
    })),
  };
}

// ----------------------------------------------------
// PROJECT SETTLEMENT
// ----------------------------------------------------

export async function fetchSettlements(): Promise<ProjectSettlement[]> {
  const rows = await fetchAllPages<ApiProjectSettlement>("/project-settlements");
  return rows.map(mapSettlement);
}

export async function fetchSettlement(
  settlementId: string,
): Promise<ProjectSettlement> {
  const { data } = await api.get(`/project-settlements/${settlementId}`);
  return mapSettlement(data?.data ?? {});
}

export async function previewSettlement(
  payload: SettlementPayload,
): Promise<SettlementPreview> {
  const { data } = await api.post("/project-settlements/preview", payload);
  const result = data?.data ?? {};
  const settlement: ApiProjectSettlement = result.projectSettlement ?? {};
  return {
    settlement: { ...mapInputs(settlement), ...mapCalc(settlement) },
    investors: (result.investorSettlements ?? []).map(mapInvestorCalc),
    warnings: (result.warnings ?? []) as SettlementWarning[],
  };
}

function mapMutationResult(data: {
  data?: { projectSettlement?: ApiProjectSettlement; warnings?: SettlementWarning[] };
}): SettlementMutationResult {
  return {
    settlement: mapSettlement(data?.data?.projectSettlement ?? {}),
    warnings: data?.data?.warnings ?? [],
  };
}

export async function createSettlement(
  payload: SettlementPayload,
): Promise<SettlementMutationResult> {
  const { data } = await api.post("/project-settlements", payload);
  return mapMutationResult(data);
}

export async function updateSettlement(
  settlementId: string,
  payload: SettlementUpdatePayload,
): Promise<SettlementMutationResult> {
  const { data } = await api.patch(
    `/project-settlements/${settlementId}`,
    payload,
  );
  return mapMutationResult(data);
}

export async function deleteSettlement(settlementId: string): Promise<void> {
  await api.delete(`/project-settlements/${settlementId}`);
}

export async function approveSettlement(
  settlementId: string,
): Promise<ProjectSettlement> {
  const { data } = await api.patch(
    `/project-settlements/${settlementId}/approve`,
  );
  return mapSettlement(data?.data?.projectSettlement ?? {});
}

export async function rejectSettlement(
  settlementId: string,
): Promise<ProjectSettlement> {
  const { data } = await api.patch(
    `/project-settlements/${settlementId}/reject`,
  );
  return mapSettlement(data?.data?.projectSettlement ?? {});
}

// ----------------------------------------------------
// INVESTOR SETTLEMENT (read-only)
// ----------------------------------------------------

export async function fetchInvestorSettlements(): Promise<InvestorSettlement[]> {
  const rows = await fetchAllPages<ApiInvestorSettlement>(
    "/investor-settlements",
  );
  return rows.map((row) => mapInvestorSettlement(row));
}

// ----------------------------------------------------
// DATA PENDUKUNG FORM
// ----------------------------------------------------

export async function fetchSettlementProjectOptions(): Promise<
  SettlementProjectOption[]
> {
  const projects = await fetchProjects();
  return projects.map((p) => ({
    projectId: p.projectId,
    projectKey: p.projectKey,
    companyName: p.companyName ?? "-",
    statusLabel: projectStatusLabel[p.status] ?? p.status,
  }));
}

/** Investor pada proyek beserta total investasinya (dikelompokkan per investor_id). */
export async function fetchProjectInvestors(
  projectId: string,
): Promise<ProjectInvestorRef[]> {
  const rows = await fetchAllPages<ApiProjectInvestmentRow>(
    "/project-investments",
    { project_id: projectId },
  );

  const byInvestor = new Map<string, ProjectInvestorRef>();
  for (const row of rows) {
    const investorId = row.investor_id ?? row.investor?.investor_id;
    if (!investorId) continue;
    const current = byInvestor.get(investorId) ?? {
      investorId,
      name: fullName(row.investor?.user) || "Tanpa Nama",
      email: row.investor?.user?.email ?? "-",
      totalAmount: 0,
    };
    current.totalAmount += Number(row.amount) || 0;
    byInvestor.set(investorId, current);
  }
  return [...byInvestor.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
