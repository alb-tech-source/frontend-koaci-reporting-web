import type { Investor } from "./types";

export const dummyInvestors: Investor[] = [
  {
    id: "INV-001",
    name: "Ahmad Fauzi",
    email: "ahmad.fauzi@example.com",
    phone: "+62 812-3456-7890",
    totalInvestasi: 245_000_000,
    status: "active",
    joinedAt: "2024-11-04",
  },
  {
    id: "INV-002",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@example.com",
    phone: "+62 813-2211-4488",
    totalInvestasi: 120_500_000,
    status: "active",
    joinedAt: "2025-01-18",
  },
  {
    id: "INV-003",
    name: "Budi Santoso",
    email: "budi.santoso@example.com",
    phone: "+62 811-9090-1212",
    totalInvestasi: 58_000_000,
    status: "pending",
    joinedAt: "2025-03-22",
  },
  {
    id: "INV-004",
    name: "Dewi Lestari",
    email: "dewi.lestari@example.com",
    phone: "+62 878-5511-2233",
    totalInvestasi: 410_750_000,
    status: "active",
    joinedAt: "2024-07-09",
  },
  {
    id: "INV-005",
    name: "Rizky Pratama",
    email: "rizky.pratama@example.com",
    phone: "+62 852-7788-9911",
    totalInvestasi: 0,
    status: "inactive",
    joinedAt: "2025-05-30",
  },
];

export async function fetchInvestors(): Promise<Investor[]> {
  return dummyInvestors;
}