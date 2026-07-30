import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";

import {
  PERMISSIONS,
  type AppUser,
  type PermissionKey,
  type UserFormValues,
  type UserRole,
} from "./types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialUser?: AppUser | null;
  onSubmit: (values: UserFormValues) => void;
}

const emptyValues: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  role: "investor",
  permissions: ["users:read"],
  activate: true,
} as const;

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  initialUser,
  onSubmit,
}: Readonly<UserFormDialogProps>) {
  const [values, setValues] = useState<UserFormValues>(emptyValues);

  // 1. Hook untuk memuat data awal saat modal dibuka
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialUser) {
      setValues({
        firstName: initialUser.firstName,
        lastName: initialUser.lastName,
        email: initialUser.email,
        role: initialUser.role,
        permissions: initialUser.permissions,
        activate: initialUser.status === "active",
      });
    } else {
      setValues(emptyValues);
    }
  }, [open, mode, initialUser]);

  // 2. Hook BARU: Mengatur ulang izin akses secara otomatis ketika role diubah
  useEffect(() => {
    if (values.role === "investor") {
      setValues((v) => ({ ...v, permissions: [] }));
    } else if (values.role === "bod") {
      setValues((v) => ({ ...v, permissions: ["users:read"] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.role]);

  const togglePermission = (key: PermissionKey, checked: boolean) => {
    setValues((v) => ({
      ...v,
      permissions: checked
        ? Array.from(new Set([...v.permissions, key]))
        : v.permissions.filter((p) => p !== key),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!values.firstName || !values.email) return;
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 1. Tambahkan pembatas tinggi (max-h-[90vh]), hilangkan padding (p-0), jadikan Flexbox */}
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        
        {/* === BAGIAN 1: HEADER (STICKY) === */}
        <div className="px-6 pt-6 pb-4 border-b border-transparent">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Perbarui data akun pengguna sistem."
                : "Buat akun pengguna baru dengan role dan izin akses."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* === BAGIAN 2: ISI FORMULIR (SCROLLABLE) === */}
        {/* flex-1 dan overflow-y-auto membuat area ini bisa di-scroll tanpa melebihi layar */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {/* Berikan ID pada form agar bisa dipanggil dari Footer nanti */}
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usr-first">Nama Depan</Label>
                <Input
                  id="usr-first"
                  value={values.firstName}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, firstName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usr-last">Nama Belakang</Label>
                <Input
                  id="usr-last"
                  value={values.lastName}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, lastName: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usr-email">Email</Label>
              <Input
                id="usr-email"
                type="email"
                value={values.email}
                onChange={(e) =>
                  setValues((v) => ({ ...v, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={values.role}
                onValueChange={(r) =>
                  setValues((v) => ({ ...v, role: r as UserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="investor">Investor</SelectItem>
                  <SelectItem value="bod">BOD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Blok Izin Akses */}
            {values.role === "investor" ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Investor menggunakan alur aktivasi email sendiri, tidak memerlukan
                pengaturan izin akses tambahan.
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Izin Akses</Label>
                <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                  {PERMISSIONS.map((p) => {
                    const isBod = values.role === "bod";
                    const checked = isBod
                      ? p.key === "users:read"
                      : values.permissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          disabled={isBod}
                          onCheckedChange={(c) =>
                            togglePermission(p.key, c === true)
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{p.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.key}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {values.role === "bod" && (
                  <p className="text-xs text-muted-foreground">
                    Role BOD bersifat read-only dan tidak dapat dikustomisasi.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="usr-activate" className="text-sm">
                  Aktifkan akun langsung setelah dibuat
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pengguna dapat login begitu akun tersimpan.
                </p>
              </div>
              <Switch
                id="usr-activate"
                checked={values.activate}
                onCheckedChange={(c) => setValues((v) => ({ ...v, activate: c }))}
              />
            </div>
          </form>
        </div>

        {/* === BAGIAN 3: FOOTER (STICKY) === */}
        <div className="p-6 pt-4 border-t border-border mt-2 bg-background">
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            {/* Atribut form="user-form" menghubungkan tombol ini dengan form di atas */}
            <Button type="submit" form="user-form" variant="primary">
              Simpan
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
}