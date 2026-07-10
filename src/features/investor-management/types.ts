export type InvestorStatus = "active" | "pending" | "inactive";

export interface Investor {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalInvestasi: number;
  status: InvestorStatus;
  joinedAt: string;
}

export interface NewInvestorInput {
  name: string;
  email: string;
  phone: string;
  documentName?: string;
}