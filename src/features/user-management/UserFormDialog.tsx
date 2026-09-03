"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; 

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { type AppUser, type Permission, type UserFormValues, type UserRole } from "./types";
import { fetchPermissions } from "./api";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialUser?: AppUser | null;
  onSubmit: (values: UserFormValues) => void;
  currentUserRole?: string;
  isSubmitting?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  bod: "BOD",
  investor: "Investor",
  user: "User",
};

const ROLES_FULL_LOCKED = new Set(["superadmin"]);

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  initialUser,
  onSubmit,
  currentUserRole = "admin",
  isSubmitting = false,
}: Readonly<UserFormDialogProps>) {
  const emptyValues: UserFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    permissions: [],
    activate: true,
  };

  const [values, setValues] = useState<UserFormValues>(emptyValues);

  const { data: permissions = [], isLoading: loadingPerms } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialUser) {
      setValues({
        firstName: initialUser.firstName || "",
        lastName: initialUser.lastName || "",
        email: initialUser.email || "",
        role: initialUser.role,
        permissions: initialUser.permissions,
        activate: initialUser.status === "active",
      });
    } else {
      setValues(emptyValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialUser]);

  const togglePermission = (key: string, checked: boolean) => {
    setValues((v) => ({
      ...v,
      permissions: checked
        ? Array.from(new Set([...v.permissions, key]))
        : v.permissions.filter((p) => p !== key),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!values.firstName || !values.email) {
      toast.warning("Mohon lengkapi Nama Depan dan Email.");
      return;
    }

    const payload = { ...values };

    if (mode === "edit" && initialUser) {
      if (payload.firstName === initialUser.firstName) delete (payload as any).firstName;
      if (payload.lastName === (initialUser.lastName || "")) delete (payload as any).lastName;
      if (payload.email === initialUser.email) delete (payload as any).email;
    }

    onSubmit(payload);
  };

  const availableRoles: UserRole[] = currentUserRole === "superadmin"
    ? ["superadmin", "admin", "bod", "investor", "user"]
    : ["admin", "bod", "investor", "user"];

  const showPermissions = true;
  const isFullLocked = ROLES_FULL_LOCKED.has(values.role);

  const getChecked = (key: string): boolean => {
    if (isFullLocked) return true; 
    return values.permissions.includes(key);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
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

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usr-first">Nama Depan</Label>
                <Input
                  id="usr-first"
                  value={values.firstName}
                  onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usr-last">Nama Belakang</Label>
                <Input
                  id="usr-last"
                  value={values.lastName}
                  onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usr-email">Email</Label>
              <Input
                id="usr-email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={values.role}
                onValueChange={(r) => setValues((v) => ({ ...v, role: r as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!showPermissions ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                {values.role === "user"
                  ? "User dapat registrasi mandiri. Akses dibatasi hingga admin mengupgrade ke role Investor."
                  : "Investor menggunakan alur aktivasi sendiri, tidak perlu pengaturan izin."}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Izin Akses</Label>
                  {isFullLocked && (
                    <span className="text-xs text-muted-foreground">Akses penuh (terkunci)</span>
                  )}
                </div>
                {loadingPerms ? (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                    {permissions.map((p) => (
                      <label
                        key={p.key}
                        className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={getChecked(p.key)}
                          disabled={isFullLocked}
                          onCheckedChange={(c) => togglePermission(p.key, c === true)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.key}</p>
                        </div>
                      </label>
                    ))}
                  </div>
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
          </div>

          <div className="p-6 pt-4 border-t border-border bg-background shrink-0">
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting} 
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSubmitting} 
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : mode === "edit" ? (
                  "Simpan Perubahan"
                ) : (
                  "Simpan Pengguna"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}