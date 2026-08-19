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

import type { CompanyType, NewCompanyInput } from "./types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewCompanyInput) => void;
}

const jenisOptions: CompanyType[] = [
  "PT",
  "CV",
  "Firma",
  "Koperasi",
  "UD",
  "Perorangan",
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
}: Readonly<CompanyFormDialogProps>) {
  const [form, setForm] = useState<NewCompanyInput>(emptyForm);

  const update = <K extends keyof NewCompanyInput>(
    key: K,
    value: NewCompanyInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => setForm(emptyForm);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.company_name || !form.company_email) return;
    onSubmit(form);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Perusahaan</DialogTitle>
          <DialogDescription>
            Isi data profil perusahaan, data direktur, dan ahli waris. Dokumen legalitas dapat ditambahkan
            setelah profil tersimpan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* SEKSI 1: DATA PERUSAHAAN */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">1. Data Perusahaan</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-nama">
                  Nama Perusahaan <span className="text-danger">*</span>
                </Label>
                <Input
                  id="cmp-nama"
                  placeholder="PT Contoh Sejahtera"
                  value={form.company_name}
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
                  placeholder="Contoh: Keuangan Syariah"
                  value={form.industry_sector}
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
                  placeholder="corporate@perusahaan.id"
                  value={form.company_email}
                  onChange={(e) => update("company_email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cmp-website">Website</Label>
                <Input
                  id="cmp-website"
                  type="url"
                  placeholder="https://perusahaan.id"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-deskripsi">Deskripsi Singkat</Label>
                <Textarea
                  id="cmp-deskripsi"
                  placeholder="Tentang perusahaan..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cmp-alamat">Alamat Perusahaan</Label>
                <Textarea
                  id="cmp-alamat"
                  placeholder="Alamat lengkap kantor pusat..."
                  value={form.company_address}
                  onChange={(e) => update("company_address", e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SEKSI 2: DATA DIREKTUR */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">2. Data Direktur</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dir-nama">Nama Direktur</Label>
                <Input
                  id="dir-nama"
                  placeholder="Nama lengkap direktur"
                  value={form.director_name}
                  onChange={(e) => update("director_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir-telepon">No. Telepon Direktur</Label>
                <Input
                  id="dir-telepon"
                  type="tel"
                  placeholder="+62 812..."
                  value={form.director_phone}
                  onChange={(e) => update("director_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dir-privy">Privy ID</Label>
                <Input
                  id="dir-privy"
                  placeholder="ID Privy"
                  value={form.director_privy}
                  onChange={(e) => update("director_privy", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* SEKSI 3: DATA AHLI WARIS */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">3. Data Ahli Waris Direktur</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-nama">Nama Ahli Waris</Label>
                <Input
                  id="heir-nama"
                  placeholder="Nama lengkap ahli waris"
                  value={form.heirs_director_name}
                  onChange={(e) => update("heirs_director_name", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-telepon">No. Telepon Ahli Waris</Label>
                <Input
                  id="heir-telepon"
                  type="tel"
                  placeholder="+62 812..."
                  value={form.heirs_director_phone}
                  onChange={(e) => update("heirs_director_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="heir-alamat">Alamat Ahli Waris</Label>
                <Textarea
                  id="heir-alamat"
                  placeholder="Alamat lengkap ahli waris..."
                  value={form.heirs_director_address}
                  onChange={(e) => update("heirs_director_address", e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Perusahaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}