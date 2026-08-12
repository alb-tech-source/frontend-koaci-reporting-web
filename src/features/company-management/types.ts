export type LegalStatus = "valid" | "expired" | "pending_renewal";

export type CompanyType = "PT" | "CV" | "Firma" | "Koperasi" | "UD";

export interface LegalDocument {
  id: string;
  jenis: string;
  nomor: string;
  tanggalTerbit: string;
  tanggalKedaluwarsa: string;
  status: LegalStatus;
}

export interface Company {
  id: string;
  nama: string;
  jenis: CompanyType;
  sektor: string;
  deskripsi: string;
  tanggalBerdiri: string;
  email: string;
  telepon: string;
  alamat: string;
  website: string;
  statusLegalitas: LegalStatus;
  dokumen: LegalDocument[];
}

export interface NewCompanyInput {
  nama: string;
  jenis: CompanyType;
  sektor: string;
  deskripsi: string;
  tanggalBerdiri: string;
  email: string;
  telepon: string;
  alamat: string;
  website: string;
}