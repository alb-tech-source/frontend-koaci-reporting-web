export type PaymentMethod = "cash" | "transfer";

export interface ProjectInvestment {
  projectInvestmentId: string;
  projectId: string;
  investorId: string;
  amount: number;
  totalPackage: number;
  sourceAccountTransaction?: string;
  accountReference?: string;
  receiptNumber?: string;
  paymentMethod: PaymentMethod;
  destinationAccountNumber?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    projectId: string;
    projectKey: string;
    fundingRequired: number;
    status: string;
    company?: { 
      companyName: string;
    };
  };
  investor: {
    investorId: string;
    nik: string;
    user: { 
      firstname: string; 
      lastname: string; 
      email: string; 
    };
  };
  receiptDocument?: {
    receiptDocumentId: string;
    receiptName: string;
    objectKey: string;
    uploadedAt: string;
  } | null;
}

export interface InvestmentFormValues {
  project_id: string;
  investor_id: string;
  amount: number;
  total_package: number;
  source_account_transaction?: string;
  account_reference?: string;
  receipt_number?: string;
  payment_method: PaymentMethod;
  destination_account_number?: string;
}

export interface InvestmentProjectOption {
  projectId: string;
  projectKey: string;
  companyName?: string;
}

export interface InvestmentInvestorOption {
  investorId: string;
  name: string;
  nik: string;
}