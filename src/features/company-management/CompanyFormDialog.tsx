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

import type { CompanyType, NewCompanyInput } from "./types";

interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewCompanyInput) => void;
}

const jenisOptions: CompanyType[] = ["PT", "CV", "Firma", "Koperasi", "UD"];

const emptyForm: NewCompanyInput = {
  nama: "",
  jenis: "PT",
  sektor: "",
  deskripsi: "",
  tanggalBerdiri: "",
  email: "",
  telepon: "",
  alamat: "",
  website: "",
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
    if (!form.nama || !form.email) return;
    onSubmit(form);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Perusahaan</DialogTitle>
          <DialogDescription>
            Isi data profil perusahaan. Dokumen legalitas dapat ditambahkan
            setelah perusahaan tersimpan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cmp-nama">Nama Perusahaan</Label>
              <Input
                id="cmp-nama"
                placeholder="PT Contoh Sejahtera"
                value={form.nama}
                onChange={(e) => update("nama", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cmp-jenis">Jenis</Label>
              <Select
                value={form.jenis}
                onValueChange={(v) => update("jenis", v as CompanyType)}
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
                value={form.sektor}
                onChange={(e) => update("sektor", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cmp-deskripsi">Deskripsi</Label>
              <Textarea
                id="cmp-deskripsi"
                placeholder="Deskripsi singkat perusahaan…"
                value={form.deskripsi}
                onChange={(e) => update("deskripsi", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cmp-tanggal">Tanggal Berdiri</Label>
              <Input
                id="cmp-tanggal"
                type="date"
                value={form.tanggalBerdiri}
                onChange={(e) => update("tanggalBerdiri", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cmp-email">Email</Label>
              <Input
                id="cmp-email"
                type="email"
                placeholder="corporate@perusahaan.id"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cmp-telepon">Telepon</Label>
              <Input
                id="cmp-telepon"
                type="tel"
                placeholder="+62 21 5555 1234"
                value={form.telepon}
                onChange={(e) => update("telepon", e.target.value)}
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
              <Label htmlFor="cmp-alamat">Alamat</Label>
              <Textarea
                id="cmp-alamat"
                placeholder="Alamat lengkap kantor…"
                value={form.alamat}
                onChange={(e) => update("alamat", e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
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