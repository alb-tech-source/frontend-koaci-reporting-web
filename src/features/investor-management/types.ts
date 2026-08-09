export type InvestorStatus = "active" | "pending" | "inactive";
export type InvestorType = "individu" | "korporasi";
export type Gender = "male" | "female";
export type HeirRelation = "spouse" | "child" | "parent" | "sibling" | "other";

export interface HeirData {
  name: string;
  relation: HeirRelation | "";
  nik: string;
  address: string;
  accountNumber: string;
  bankName: string;
  phone: string;
}

export interface Investor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  investorType: InvestorType;
  gender: Gender;
  nik: string;
  address: string;
  accountNumber: string;
  bankName: string;
  documentName?: string;
  heir?: HeirData;
  totalInvestasi: number;
  status: InvestorStatus;
  joinedAt: string;
}

export interface InvestorFormValues {
  userId: string;
  name: string;
  email: string;
  phone: string;
  investorType: InvestorType;
  gender: Gender;
  nik: string;
  address: string;
  accountNumber: string;
  bankName: string;
  documentName?: string;
  status: string;
  heir: HeirData;
}

export type NewInvestorInput = InvestorFormValues;

/** User dengan role investor yang belum terhubung ke profil investor */
export interface LinkableUser {
  id: string;
  name: string;
  email: string;
}
