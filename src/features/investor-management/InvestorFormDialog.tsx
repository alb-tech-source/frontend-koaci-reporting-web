import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Upload } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

import { INDONESIAN_BANKS, emptyHeirData, heirRelationOptions } from "./utils";
import type {
  Gender,
  HeirData,
  HeirRelation,
  Investor,
  InvestorFormValues,
  InvestorType,
  LinkableUser,
} from "./types";

interface InvestorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // UPDATE: Tambahkan parameter file opsional pada fungsi onSubmit
  onSubmit: (input: InvestorFormValues, file?: File | null) => void;
  users: LinkableUser[];
  mode?: "create" | "edit";
  initialValue?: Investor | null;
}

const emptyValues: InvestorFormValues = {
  userId: "",
  name: "",
  email: "",
  phone: "",
  investorType: "individu",
  gender: "male",
  nik: "",
  address: "",
  accountNumber: "",
  bankName: "",
  documentName: "",
  heir: { ...emptyHeirData },
};

export function InvestorFormDialog({
  open,
  onOpenChange,
  onSubmit,
  users,
  mode = "create",
  initialValue = null,
}: Readonly<InvestorFormDialogProps>) {
  const [values, setValues] = useState<InvestorFormValues>(emptyValues);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State penyimpan file fisik
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [nikError, setNikError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      setValues({
        userId: initialValue.userId,
        name: initialValue.name,
        email: initialValue.email,
        phone: initialValue.phone,
        investorType: initialValue.investorType,
        gender: initialValue.gender,
        nik: initialValue.nik,
        address: initialValue.address,
        accountNumber: initialValue.accountNumber,
        bankName: initialValue.bankName,
        documentName: initialValue.documentName ?? "",
        heir: initialValue.heir ?? { ...emptyHeirData },
      });
    } else {
      setValues({ ...emptyValues, heir: { ...emptyHeirData } });
    }
    setNikError("");
    setSelectedFile(null); // Reset file saat pop-up dibuka ulang
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, initialValue]);

  const set = <K extends keyof InvestorFormValues>(
    key: K,
    value: InvestorFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  const setHeir = <K extends keyof HeirData>(key: K, value: HeirData[K]) =>
    setValues((prev) => ({ ...prev, heir: { ...prev.heir, [key]: value } }));

  const userOptions = useMemo(() => {
    if (initialValue && !users.some((u) => u.id === initialValue.userId)) {
      return [
        {
          id: initialValue.userId,
          name: initialValue.name,
          email: initialValue.email,
        },
        ...users,
      ];
    }
    return users;
  }, [users, initialValue]);

  const selectedUser = userOptions.find((u) => u.id === values.userId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (values.nik.length !== 16) {
      setNikError("NIK harus terdiri dari 16 digit angka.");
      return;
    }
    if (!values.userId || !values.bankName) return;
    
    // UPDATE: Kirim nilai teks DAN file fisiknya
    onSubmit(values, selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 text-left">
          <DialogTitle>
            {mode === "edit" ? "Edit Investor" : "Tambah Investor"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi data profil investor. Field bertanda{" "}
            <span className="text-danger">*</span> wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <form
          id="investor-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5"
        >
          {/* Pilih user */}
          <div className="space-y-2">
            <Label>
              Pilih User Terdaftar <span className="text-danger">*</span>
            </Label>
            <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={userPickerOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedUser ? (
                    <span className="truncate">
                      {selectedUser.name} · {selectedUser.email}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Cari nama atau email user...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Cari nama atau email user..." />
                  <CommandList>
                    <CommandEmpty>User tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {userOptions.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.name} ${user.email}`}
                          onSelect={() => {
                            setValues((prev) => ({
                              ...prev,
                              userId: user.id,
                              name: user.name,
                              email: user.email,
                            }));
                            setUserPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              user.id === values.userId
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Hanya menampilkan user ber-role Investor yang belum terhubung ke
              profil investor.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Nama Lengkap</Label>
              <Input
                id="inv-name"
                value={values.name}
                readOnly
                placeholder="Terisi otomatis dari user"
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-email">Email</Label>
              <Input
                id="inv-email"
                type="email"
                value={values.email}
                readOnly
                placeholder="Terisi otomatis dari user"
                className="bg-muted/50"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inv-phone">No. Telepon</Label>
              <Input
                id="inv-phone"
                type="tel"
                placeholder="+62 812-3456-7890"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-nik">
                NIK <span className="text-danger">*</span>
              </Label>
              <Input
                id="inv-nik"
                inputMode="numeric"
                maxLength={16}
                placeholder="16 digit angka"
                value={values.nik}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                  set("nik", digits);
                  setNikError("");
                }}
                aria-invalid={Boolean(nikError)}
                required
              />
              {nikError ? (
                <p className="text-xs text-danger">{nikError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {values.nik.length}/16 digit
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Tipe Investor <span className="text-danger">*</span>
              </Label>
              <Select
                value={values.investorType}
                onValueChange={(v) => set("investorType", v as InvestorType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individu">Individu</SelectItem>
                  <SelectItem value="korporasi">Korporasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Jenis Kelamin <span className="text-danger">*</span>
              </Label>
              <Select
                value={values.gender}
                onValueChange={(v) => set("gender", v as Gender)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Laki-laki</SelectItem>
                  <SelectItem value="female">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-address">
              Alamat <span className="text-danger">*</span>
            </Label>
            <Textarea
              id="inv-address"
              rows={3}
              placeholder="Alamat lengkap sesuai KTP"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inv-rek">
                Nomor Rekening <span className="text-danger">*</span>
              </Label>
              <Input
                id="inv-rek"
                inputMode="numeric"
                placeholder="Contoh: 1234567890"
                value={values.accountNumber}
                onChange={(e) => set("accountNumber", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Nama Bank <span className="text-danger">*</span>
              </Label>
              <Select
                value={values.bankName}
                onValueChange={(v) => set("bankName", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bank" />
                </SelectTrigger>
                <SelectContent>
                  {INDONESIAN_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload dokumen */}
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
                {values.documentName || "Belum ada file dipilih"}
              </span>
              <input
                ref={fileInputRef}
                id="inv-doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  // UPDATE: Tangkap objek filenya di sini
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    set("documentName", file.name);
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Format PDF, JPG, atau PNG. Maks. 5 MB.
            </p>
          </div>

          {/* Ahli waris */}
          <Accordion
            type="single"
            collapsible
            className="rounded-xl border border-border px-4"
          >
            <AccordionItem value="heir" className="border-none">
              <AccordionTrigger className="text-sm font-medium">
                Data Ahli Waris (Opsional)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="heir-name">Nama Ahli Waris</Label>
                    <Input
                      id="heir-name"
                      value={values.heir.name}
                      onChange={(e) => setHeir("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hubungan dengan Investor</Label>
                    <Select
                      value={values.heir.relation || undefined}
                      onValueChange={(v) =>
                        setHeir("relation", v as HeirRelation)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hubungan" />
                      </SelectTrigger>
                      <SelectContent>
                        {heirRelationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heir-nik">NIK Ahli Waris</Label>
                    <Input
                      id="heir-nik"
                      inputMode="numeric"
                      maxLength={16}
                      value={values.heir.nik}
                      onChange={(e) =>
                        setHeir(
                          "nik",
                          e.target.value.replace(/\D/g, "").slice(0, 16),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heir-phone">No. Telepon Ahli Waris</Label>
                    <Input
                      id="heir-phone"
                      type="tel"
                      value={values.heir.phone}
                      onChange={(e) => setHeir("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heir-rek">Nomor Rekening Ahli Waris</Label>
                    <Input
                      id="heir-rek"
                      inputMode="numeric"
                      value={values.heir.accountNumber}
                      onChange={(e) => setHeir("accountNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Bank Ahli Waris</Label>
                    <Select
                      value={values.heir.bankName || undefined}
                      onValueChange={(v) => setHeir("bankName", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDONESIAN_BANKS.map((bank) => (
                          <SelectItem key={`heir-${bank}`} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heir-address">Alamat Ahli Waris</Label>
                  <Textarea
                    id="heir-address"
                    rows={2}
                    value={values.heir.address}
                    onChange={(e) => setHeir("address", e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>

        <DialogFooter className="shrink-0 border-t border-border bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" form="investor-form" variant="primary">
            {mode === "edit" ? "Simpan Perubahan" : "Simpan Investor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}