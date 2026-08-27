"use client";

import React, { useState, useEffect } from "react";

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

import type { Company, CompanyType, NewCompanyInput } from "./types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewCompanyInput) => void;
  mode: "create" | "edit";
  initialData?: Company | null;
  isSubmitting?: boolean;
}

const jenisOptions: CompanyType[] = [
  "PT", "CV", "Firma", "Koperasi", "UD", "Perorangan",
];

const emptyForm: NewCompanyInput = {
  company_name: "",
  company_type: "PT",
  industry_sector: "",
  description: "",
  director_name: "",
  director_phone: "",
  company_email: "",
  director_privy: "",
  company_address: "",
  website: "",
  heirs_director_name: "",
  heirs_director_phone: "",
  heirs_director_address: "",
};

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  initialData,
  isSubmitting = false,
}: Readonly<CompanyFormDialogProps>) {
  const [form, setForm] = useState<NewCompanyInput>(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      setForm({
        company_name: initialData.nama || "",
        company_type: initialData.jenis || "PT",
        industry_sector: initialData.sektor !== "-" ? initialData.sektor : "",
        description: initialData.deskripsi !== "-" ? initialData.deskripsi : "",
        director_name: initialData.direktorNama !== "-" ? initialData.direktorNama : "",
        director_phone: initialData.direktorTelepon !== "-" ? initialData.direktorTelepon : "",
        company_email: initialData.email !== "-" ? initialData.email : "",
        director_privy: initialData.direktorPrivy !== "-" ? initialData.direktorPrivy : "",
        company_address: initialData.alamat !== "-" ? initialData.alamat : "",
        website: initialData.website !== "-" ? initialData.website : "",
        heirs_director_name: initialData.ahliWarisNama !== "-" ? initialData.ahliWarisNama : "",
        heirs_director_phone: initialData.ahliWarisTelepon && initialData.ahliWarisTelepon !== "-" ? initialData.ahliWarisTelepon : "",
        heirs_director_address: initialData.ahliWarisAlamat && initialData.ahliWarisAlamat !== "-" ? initialData.ahliWarisAlamat : "",
      });
      setFormError("");
    } else if (open && mode === "create") {
      setForm(emptyForm);
      setFormError("");
    }
  }, [open, mode, initialData]);

  const update = <K extends keyof NewCompanyInput>(key: K, value: NewCompanyInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!form.company_name.trim()) {
      return setFormError("Nama perusahaan wajib diisi.");
    }
    if (!form.company_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.company_email)) {
      return setFormError("Format email perusahaan tidak valid.");
    }
    if (form.director_phone && !/^\+?[0-9]{10,15}$/.test(form.director_phone)) {
      return setFormError("Format nomor telepon direktur tidak valid.");
    }

    const cleanedPayload = Object.fromEntries(
      Object.entries(form).filter(([_, value]) => value !== "")
    ) as NewCompanyInput;

    onSubmit(cleanedPayload);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Perusahaan" : "Tambah Perusahaan"}</DialogTitle>
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
            <h4 className="text-sm font-semibold text-foreground">1. Data Perusahaan</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-nama">Nama Perusahaan <span className="text-danger">*</span></Label>
                <Input id="cmp-nama" placeholder="PT Contoh" value={form.company_name} onChange={(e) => update("company_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-jenis">Jenis Perusahaan</Label>
                <Select value={form.company_type} onValueChange={(v) => update("company_type", v as string)}>
                  <SelectTrigger id="cmp-jenis"><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                  <SelectContent>
                    {jenisOptions.map((j) => (<SelectItem key={j} value={j}>{j}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-sektor">Sektor Industri</Label>
                <Input id="cmp-sektor" value={form.industry_sector} onChange={(e) => update("industry_sector", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-email">Email Perusahaan <span className="text-danger">*</span></Label>
                <Input id="cmp-email" type="email" value={form.company_email} onChange={(e) => update("company_email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-website">Website</Label>
                <Input id="cmp-website" type="url" value={form.website} onChange={(e) => update("website", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-deskripsi">Deskripsi Singkat</Label>
                <Textarea id="cmp-deskripsi" rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-alamat">Alamat Perusahaan</Label>
                <Textarea id="cmp-alamat" rows={2} value={form.company_address} onChange={(e) => update("company_address", e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">2. Data Direktur</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dir-nama">Nama Direktur</Label>
                <Input id="dir-nama" value={form.director_name} onChange={(e) => update("director_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir-telepon">No. Telepon Direktur</Label>
                <Input id="dir-telepon" type="tel" value={form.director_phone} onChange={(e) => update("director_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir-privy">Privy ID</Label>
                <Input id="dir-privy" value={form.director_privy} onChange={(e) => update("director_privy", e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">3. Data Ahli Waris Direktur</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-nama">Nama Ahli Waris</Label>
                <Input id="heir-nama" value={form.heirs_director_name} onChange={(e) => update("heirs_director_name", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-telepon">No. Telepon Ahli Waris</Label>
                <Input id="heir-telepon" type="tel" value={form.heirs_director_phone} onChange={(e) => update("heirs_director_phone", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-alamat">Alamat Ahli Waris</Label>
                <Textarea id="heir-alamat" rows={2} value={form.heirs_director_address} onChange={(e) => update("heirs_director_address", e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Perusahaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}