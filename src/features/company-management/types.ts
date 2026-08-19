// Status dari backend
export type CompanyStatus = "active" | "inactive" | "blacklist";
export type CompanyType = "PT" | "CV" | "Firma" | "Perorangan" | "UD" | "Koperasi";

// Response dari GET /companies
export interface ApiCompany {
  company_id: string;
  company_name: string;
  company_type: string;
  industry_sector: string;
  description: string;
  director_name: string;
  director_phone: string;
  company_email: string;
  director_privy: string;
  company_address: string;
  website: string;
  heirs_director_name: string;
  heirs_director_phone: string;
  heirs_director_address: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
  companyDocument: ApiCompanyDocument[];
}

export interface ApiCompanyDocument {
  document_id: string;
  company_id: string;
  document_type: string;
  document_name: string;
  storage_provider: string;
  object_key: string;
  file_size_bytes: string;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  user?: { user_id: string; firstname: string; lastname: string; email: string };
}

// App-level types (tetap pakai bahasa Indonesia untuk kompatibilitas UI)
export interface Company {
  id: string;
  nama: string;
  jenis: string;
  sektor: string;
  deskripsi: string;
  email: string;
  telepon: string;
  alamat: string;
  website: string;
  direktorNama: string;
  direktorTelepon: string;
  direktorPrivy: string;
  ahliWarisNama: string;
  ahliWarisTelepon: string;
  ahliWarisAlamat: string;
  status: CompanyStatus;
  createdAt: string;
  dokumen: CompanyDocument[];
}

export interface CompanyDocument {
  id: string;
  tipe: string;
  nama: string;
  provider: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface NewCompanyInput {
  company_name: string;
  company_type: string;
  industry_sector: string;
  description: string;
  director_name: string;
  director_phone: string;
  company_email: string;
  director_privy: string;
  company_address: string;
  website: string;
  heirs_director_name: string;
  heirs_director_phone: string;
  heirs_director_address: string;
}

// Mapper
export function mapApiCompany(c: ApiCompany): Company {
  return {
    id: c.company_id,
    nama: c.company_name,
    jenis: c.company_type,
    sektor: c.industry_sector,
    deskripsi: c.description,
    email: c.company_email,
    telepon: c.director_phone,
    alamat: c.company_address,
    website: c.website,
    direktorNama: c.director_name,
    direktorTelepon: c.director_phone,
    direktorPrivy: c.director_privy,
    ahliWarisNama: c.heirs_director_name,
    ahliWarisTelepon: c.heirs_director_phone,
    ahliWarisAlamat: c.heirs_director_address,
    status: c.status,
    createdAt: c.createdAt,
    dokumen: (c.companyDocument ?? []).map((d) => ({
      id: d.document_id,
      tipe: d.document_type,
      nama: d.document_name,
      provider: d.storage_provider,
      fileSizeBytes: parseInt(d.file_size_bytes, 10) || 0,
      mimeType: d.mime_type,
      uploadedAt: d.uploaded_at,
      uploadedBy: d.user ? `${d.user.firstname} ${d.user.lastname}`.trim() : undefined,
    })),
  };
}