import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, MailCheck, MailWarning } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getErrorMessage } from "@/shared/lib/axios";
import { formatDateID, formatRelativeTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { useAuthStore, type UserProfile } from "@/shared/store/authStore";

import { fetchCurrentUser } from "@/features/auth/api";
import { roleBadgeClass, roleDisplay } from "@/features/activity-log/utils";

import {
  sendMyVerifyEmail,
  updateMyProfile,
  type UpdateProfilePayload,
} from "./api";
import { isValidEmail } from "./utils";

const meQuery = {
  queryKey: ["auth", "me"],
  queryFn: async (): Promise<UserProfile> => {
    const res = await fetchCurrentUser();
    return res?.data?.user;
  },
};

interface ProfileValues {
  firstname: string;
  lastname: string;
  email: string;
}

type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

function toValues(user: UserProfile): ProfileValues {
  return {
    firstname: user.firstname ?? "",
    lastname: user.lastname ?? "",
    email: user.email ?? "",
  };
}

function validate(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!values.firstname.trim()) errors.firstname = "Nama depan wajib diisi.";
  else if (values.firstname.trim().length > 50)
    errors.firstname = "Maksimal 50 karakter.";
  if (!values.lastname.trim()) errors.lastname = "Nama belakang wajib diisi.";
  else if (values.lastname.trim().length > 50)
    errors.lastname = "Maksimal 50 karakter.";
  if (!isValidEmail(values.email)) errors.email = "Format email tidak valid.";
  return errors;
}

export function ProfileForm() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { data: user, isLoading } = useQuery(meQuery);

  const [values, setValues] = useState<ProfileValues>({
    firstname: "",
    lastname: "",
    email: "",
  });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [confirmEmailOpen, setConfirmEmailOpen] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  // Isi form dari data server setiap kali profil (re)load — pola reset-saat-render
  const resetKey = user ? `${user.user_id}:${String(user.updatedAt ?? "")}` : "memuat";
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setErrors({});
    if (user) setValues(toValues(user));
  }

  const original = user ? toValues(user) : values;
  const changes: UpdateProfilePayload = {};
  if (values.firstname.trim() !== original.firstname)
    changes.firstname = values.firstname.trim();
  if (values.lastname.trim() !== original.lastname)
    changes.lastname = values.lastname.trim();
  if (values.email.trim().toLowerCase() !== original.email.toLowerCase())
    changes.email = values.email.trim();
  const isDirty = Object.keys(changes).length > 0;

  const set = (key: keyof ProfileValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      updateMyProfile(user!.user_id, payload),
    onSuccess: async (result) => {
      // Segarkan profil agar header & auth store memakai data terbaru
      const fresh = await fetchCurrentUser();
      if (fresh?.data?.user) {
        setAuth(fresh.data.user);
        queryClient.setQueryData(meQuery.queryKey, fresh.data.user);
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEmailChanged(result.requiresEmailVerification);
      toast.success("Profil berhasil diperbarui.");
    },
    onError: (err: unknown) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        setErrors({ email: "Email sudah digunakan user lain." });
        return;
      }
      toast.error(getErrorMessage(err, "Gagal memperbarui profil."));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: sendMyVerifyEmail,
    onSuccess: (message) => toast.success(message),
    onError: (err: unknown) =>
      toast.error(getErrorMessage(err, "Gagal mengirim email verifikasi.")),
  });

  const handleSave = () => {
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0 || !isDirty) return;
    // Email dipakai untuk login — minta konfirmasi sebelum mengubahnya
    if (changes.email) {
      setConfirmEmailOpen(true);
      return;
    }
    saveMutation.mutate(changes);
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const displayName =
    `${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || user.email;
  const initials = (user.firstname || user.email).slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 shadow-card sm:flex-row sm:items-center">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-gradient-brand text-lg text-brand-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold text-foreground">
              {displayName}
            </p>
            <Badge className={cn(roleBadgeClass(user.role.role_name))}>
              {roleDisplay(user.role.role_name)}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
          <InfoItem
            label="Login terakhir"
            value={formatRelativeTime(user.last_login_at)}
          />
          <InfoItem
            label="Bergabung"
            value={formatDateID(String(user.createdAt ?? ""))}
          />
        </div>
      </section>

      {emailChanged ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 sm:flex-row sm:items-center">
          <MailWarning className="h-5 w-5 shrink-0 text-warning" />
          <p className="flex-1 text-sm text-foreground">
            Email Anda telah diubah dan belum terverifikasi. Kirim link
            verifikasi ke <span className="font-medium">{user.email}</span>.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <MailCheck className="mr-1.5 h-4 w-4" />
            )}
            Kirim Email Verifikasi
          </Button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-background shadow-card">
        <div className="border-b border-border p-5">
          <h2 className="text-base font-semibold text-foreground">
            Informasi Profil
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Nama ditampilkan di aplikasi dan riwayat aktivitas. Email dipakai
            untuk login.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nama Depan *" htmlFor="firstname" error={errors.firstname}>
            <Input
              id="firstname"
              value={values.firstname}
              maxLength={50}
              onChange={(e) => set("firstname", e.target.value)}
            />
          </Field>
          <Field label="Nama Belakang *" htmlFor="lastname" error={errors.lastname}>
            <Input
              id="lastname"
              value={values.lastname}
              maxLength={50}
              onChange={(e) => set("lastname", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Email *"
              htmlFor="email"
              error={errors.email}
              hint={
                changes.email
                  ? "Setelah diubah, Anda login dengan email baru dan perlu memverifikasinya."
                  : undefined
              }
            >
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button
            variant="outline"
            disabled={!isDirty || saveMutation.isPending}
            onClick={() => {
              setValues(toValues(user));
              setErrors({});
            }}
          >
            Batalkan
          </Button>
          <Button
            variant="primary"
            disabled={!isDirty || saveMutation.isPending}
            onClick={handleSave}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </section>

      <AlertDialog open={confirmEmailOpen} onOpenChange={setConfirmEmailOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah email login?</AlertDialogTitle>
            <AlertDialogDescription>
              Email login akan berubah dari{" "}
              <span className="font-medium text-foreground">{user.email}</span>{" "}
              menjadi{" "}
              <span className="font-medium text-foreground">
                {changes.email}
              </span>
              . Gunakan email baru saat login berikutnya, lalu verifikasi email
              tersebut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => saveMutation.mutate(changes)}>
              Ya, Ubah Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: Readonly<{
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-warning">{hint}</p>
      ) : null}
    </div>
  );
}

function InfoItem({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
