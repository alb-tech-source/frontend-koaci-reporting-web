import type { ProjectInvestment } from "./types";

export const paymentMethodLabel: Record<string, string> = {
  transfer: "Transfer",
  cash: "Tunai",
};

export function investorFullName(investment: ProjectInvestment): string {
  return `${investment.investor.user.firstname} ${investment.investor.user.lastname}`.trim();
}