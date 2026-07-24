import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";

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

import type { NewInvestorInput } from "./types";

interface InvestorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewInvestorInput) => void;
}

export function InvestorFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: Readonly<InvestorFormDialogProps>) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentName, setDocumentName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setDocumentName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    onSubmit({ name, email, phone, documentName });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Investor</DialogTitle>
          <DialogDescription>
            Isi data investor baru. Data akan tampil di daftar setelah disimpan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-name">Nama Lengkap</Label>
            <Input
              id="inv-name"
              placeholder="Contoh: Ahmad Fauzi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-email">Email</Label>
            <Input
              id="inv-email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-phone">No. Telepon</Label>
            <Input
              id="inv-phone"
              type="tel"
              placeholder="+62 812-3456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-doc">Upload Dokumen</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Pilih file
              </Button>
              <span className="truncate text-sm text-muted-foreground">
                {documentName || "Belum ada file dipilih"}
              </span>
              <input
                ref={fileInputRef}
                id="inv-doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) =>
                  setDocumentName(e.target.files?.[0]?.name ?? "")
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Format PDF, JPG, atau PNG. Maks. 5 MB.
            </p>
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
              Simpan Investor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
