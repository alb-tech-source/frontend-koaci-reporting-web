"use client";

import React, { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Loader2 } from "lucide-react";

import type {
  Company,
  CompanyType,
  NewCompanyInput,
  StatusType,
} from "./types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewCompanyInput) => void;
  mode: "create" | "edit";
  initialData?: Company | null;
  isSubmitting?: boolean;
}

// Selaras dengan enum CompanyType di backend (PT, CV, Firma, Perorangan)
const jenisOptions: CompanyType[] = ["PT", "CV", "Firma", "Perorangan"];

const jenisStatus: StatusType[] = ["active", "inactive", "blacklist"];

// Field wajib sesuai skema backend — hanya ini yang ada di state awal.
const REQUIRED_KEYS = new Set<keyof NewCompanyInput>([
  "company_name",
  "company_type",
  "company_email",
  "director_name",
  "director_phone",
  "company_address",
]);

const emptyForm: Partial<NewCompanyInput> = {
  company_name: "",
  company_type: "PT",
  company_email: "",
  director_name: "",
  director_phone: "",
  company_address: "",
};

const normalizeCompanyField = (value?: string | null): string => {
  if (!value || value === "-") return "";
  return value;
};

// Sesuai validasi phone di backend: 8-20 karakter, hanya angka, +, (), spasi, strip
const isPhone = (value: string): boolean =>
  /^[0-9+()\-\s]{8,20}$/.test(value.trim());

const isUrl = (value: string): boolean => {
  try {
    return Boolean(new URL(value.trim()));
  } catch {
    return false;
  }
};

const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf("@")) return false;

  const domain = trimmed.slice(atIndex + 1);
  if (!domain || domain.includes(" ")) return false;

  const lastDotIndex = domain.lastIndexOf(".");
  return lastDotIndex > 0 && lastDotIndex < domain.length - 1;
};

const buildFormFromCompany = (data: Company): Partial<NewCompanyInput> => {
  const form: Partial<NewCompanyInput> = {
    company_name: normalizeCompanyField(data.nama),
    company_type: (data.jenis as CompanyType) || "PT",
    company_email: normalizeCompanyField(data.email),
    director_name: normalizeCompanyField(data.direktorNama),
    director_phone: normalizeCompanyField(data.direktorTelepon),
    company_address: normalizeCompanyField(data.alamat),
  };

  // Field opsional hanya masuk state bila ada isinya — nilai kosong tidak pernah dikirim
  const optionalFields: Array<[keyof NewCompanyInput, string]> = [
    ["industry_sector", normalizeCompanyField(data.sektor)],
    ["description", normalizeCompanyField(data.deskripsi)],
    ["director_privy", normalizeCompanyField(data.direktorPrivy)],
    ["website", normalizeCompanyField(data.website)],
    ["heirs_director_name", normalizeCompanyField(data.ahliWarisNama)],
    ["heirs_director_phone", normalizeCompanyField(data.ahliWarisTelepon)],
    ["heirs_director_address", normalizeCompanyField(data.ahliWarisAlamat)],
  ];
  for (const [key, value] of optionalFields) {
    if (value) form[key] = value;
  }

  return form;
};

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  initialData,
  isSubmitting = false,
}: Readonly<CompanyFormDialogProps>) {
  const [form, setForm] = useState<Partial<NewCompanyInput>>(emptyForm);
  const [formError, setFormError] = useState("");

  // Reset form saat dialog dibuka / target berubah — pola reset-saat-render (tanpa effect)
  const resetKey = open ? `${mode}:${initialData?.id ?? "baru"}` : "tutup";
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setForm(
      mode === "edit" && initialData
        ? buildFormFromCompany(initialData)
        : emptyForm,
    );
    setFormError("");
  }

  const update = <K extends keyof NewCompanyInput>(
    key: K,
    value: NewCompanyInput[K],
  ) => {
    setForm((prev) => {
      const next: Partial<NewCompanyInput> = { ...prev };
      // Field opsional yang dikosongkan dihapus dari state agar tidak terkirim ke backend
      if (
        typeof value === "string" &&
        !value.trim() &&
        !REQUIRED_KEYS.has(key)
      ) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const companyName = form.company_name ?? "";
    const companyEmail = form.company_email ?? "";
    const directorName = form.director_name ?? "";
    const directorPhone = form.director_phone ?? "";
    const companyAddress = form.company_address ?? "";

    if (companyName.trim().length < 2) {
      return setFormError("Nama perusahaan wajib diisi (minimal 2 karakter).");
    }
    if (!isValidEmail(companyEmail)) {
      return setFormError("Format email perusahaan tidak valid.");
    }
    if (directorName.trim().length < 2) {
      return setFormError("Nama direktur wajib diisi (minimal 2 karakter).");
    }
    if (!isPhone(directorPhone)) {
      return setFormError(
        "No. telepon direktur wajib diisi (8-20 karakter, hanya angka, +, kurung, spasi, atau strip).",
      );
    }
    if (companyAddress.trim().length < 5) {
      return setFormError(
        "Alamat perusahaan wajib diisi (minimal 5 karakter).",
      );
    }
    if (form.website && !isUrl(form.website)) {
      return setFormError(
        "Format website tidak valid — sertakan http:// atau https://.",
      );
    }
    if (form.heirs_director_phone && !isPhone(form.heirs_director_phone)) {
      return setFormError("Format nomor telepon ahli waris tidak valid.");
    }

    // State hanya berisi field yang terisi — langsung dikirim tanpa field kosong
    onSubmit({ ...form } as NewCompanyInput);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Perusahaan" : "Tambah Perusahaan"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Perbarui data profil perusahaan, direktur, dan ahli waris."
              : "Isi data profil perusahaan, data direktur, dan ahli waris."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {formError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          {/* ... (SEKSI 1, 2, 3 SAMA PERSIS DENGAN KODE ANDA SEBELUMNYA) ... */}
          {/* Untuk menghemat panjang pesan, saya biarkan Anda me-rujuk UI form Anda yang sudah ada, intinya sama saja. */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              1. Data Perusahaan
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-nama">
                  Nama Perusahaan <span className="text-danger">*</span>
                </Label>
                <Input
                  id="cmp-nama"
                  placeholder="PT Contoh"
                  value={form.company_name ?? ""}
                  onChange={(e) => update("company_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-jenis">Jenis Perusahaan</Label>
                <Select
                  value={form.company_type}
                  onValueChange={(v) => update("company_type", v as string)}
                >
                  <SelectTrigger id="cmp-jenis">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisOptions.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-sektor">Sektor Industri</Label>
                <Input
                  id="cmp-sektor"
                  value={form.industry_sector ?? ""}
                  onChange={(e) => update("industry_sector", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-email">
                  Email Perusahaan <span className="text-danger">*</span>
                </Label>
                <Input
                  id="cmp-email"
                  type="email"
                  value={form.company_email ?? ""}
                  onChange={(e) => update("company_email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-website">Website</Label>
                <Input
                  id="cmp-website"
                  type="url"
                  value={form.website ?? ""}
                  onChange={(e) => update("website", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-deskripsi">Deskripsi Singkat</Label>
                <Textarea
                  id="cmp-deskripsi"
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-alamat">
                  Alamat Perusahaan <span className="text-danger">*</span>
                </Label>
                <Textarea
                  id="cmp-alamat"
                  rows={2}
                  value={form.company_address ?? ""}
                  onChange={(e) => update("company_address", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              2. Data Direktur
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dir-nama">
                  Nama Direktur <span className="text-danger">*</span>
                </Label>
                <Input
                  id="dir-nama"
                  value={form.director_name ?? ""}
                  onChange={(e) => update("director_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir-telepon">
                  No. Telepon Direktur <span className="text-danger">*</span>
                </Label>
                <Input
                  id="dir-telepon"
                  type="tel"
                  value={form.director_phone ?? ""}
                  onChange={(e) => update("director_phone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir-privy">Privy ID</Label>
                <Input
                  id="dir-privy"
                  value={form.director_privy ?? ""}
                  onChange={(e) => update("director_privy", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              3. Data Ahli Waris Direktur
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-nama">Nama Ahli Waris</Label>
                <Input
                  id="heir-nama"
                  value={form.heirs_director_name ?? ""}
                  onChange={(e) =>
                    update("heirs_director_name", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-telepon">No. Telepon Ahli Waris</Label>
                <Input
                  id="heir-telepon"
                  type="tel"
                  value={form.heirs_director_phone ?? ""}
                  onChange={(e) =>
                    update("heirs_director_phone", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-alamat">Alamat Ahli Waris</Label>
                <Textarea
                  id="heir-alamat"
                  rows={2}
                  value={form.heirs_director_address ?? ""}
                  onChange={(e) =>
                    update("heirs_director_address", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              4. Status Perusahaan
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-status">Status</Label>
                <Select
                  value={form.status ?? ""}
                  onValueChange={(v) => update("status", v as string)}
                >
                  <SelectTrigger id="cmp-status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisStatus.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                "Simpan Perusahaan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
